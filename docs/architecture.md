# Architecture

> **TL;DR:** Two Cloudflare Workers (web + api), one D1 database, two R2 buckets (public assets + ISR), GetStream handles all media. Better-T Stack scaffolds it.

## Broadcaster identity from Twitch

The first-run setup wizard takes a single input: **broadcaster Twitch user ID**. From it HowlCast pulls and seeds:

- **Display name** → `profiles.displayName` (editable after)
- **Bio** → `profiles.bio` (Twitch description; editable after)
- **Profile picture** → fetched from Twitch `users.profile_image_url`, downloaded to R2 `howlcast-public` once, stored as `profiles.avatarKey`
- **Channel emotes** → 4 providers query by Twitch ID (see `docs/integrations/emotes.md`)

The Twitch ID is also stored on `channelConfig.broadcasterTwitchId` for the cron + manual refresh flows. Broadcaster can edit any of the seeded profile fields freely after setup — Twitch is just the seed, not an ongoing source of truth.

## What you'll find here

1. The big-picture data flow
2. Stack decisions (with versions)
3. Storage layout
4. Repo file structure
5. Database schema
6. Why we picked split workers (and not single)

---

## Data flow

```
                ┌─────────────────────┐
                │  Your browser       │
                │  (Next.js + React)  │
                └──┬──────────────┬───┘
                   │              │
       same-domain │              │ subdomain
       /           │              │ api.howlcast.tv
                   ▼              ▼
        ┌──────────────┐   ┌──────────────┐
        │  WEB Worker  │   │  API Worker  │
        │  howlcast.tv │   │  Hono + tRPC │
        │  Next.js via │   │  Better Auth │
        │  OpenNext    │   │  Drizzle     │
        └──────┬───────┘   └──────┬───────┘
               │                  │
               │       ┌──────────┴───────────┐
               │       │                      │
               ▼       ▼                      ▼
            ┌─────┐  ┌─────┐  ┌─────┐  ┌──────────────┐
            │ R2  │  │ D1  │  │ KV  │  │  GetStream   │
            │ISR  │  │ DB  │  │cache│  │  (video+chat)│
            │imgs │  │users│  │emote│  │  external    │
            └─────┘  └─────┘  └─────┘  └──────────────┘

OBS ──RTMPS──► GetStream ──WebRTC──► viewer browsers
```

**Key insight:** stream content never touches our servers. GetStream owns the live media path. Our Workers only hand out short-lived JWTs and serve the surrounding UI.

---

## Stack (pinned versions, May 2026)

| Layer | Pick | Version | Notes |
|---|---|---|---|
| Scaffold | `create-better-t-stack` | 3.27+ | Use it. Don't fight it. |
| Framework | Next.js | 16.x | App Router, OpenNext-compatible |
| CF Adapter | `@opennextjs/cloudflare` | **≥1.17.1** | 1.17.1 patches CVE-2026-3125 |
| Backend | Hono | 4.12+ | Separate worker |
| API | tRPC v11 + `@hono/trpc-server` | 11.10+ | v11 GA since Mar 2025 |
| Client query | `@trpc/tanstack-react-query` | 11.10+ | New integration |
| ORM | Drizzle | latest | `dialect: 'sqlite'` |
| Auth | Better Auth | **≥1.5** | Native D1 support since 1.5 |
| Plugins | `username`, `twoFactor`, `passkey`, `magicLink` | matching 1.5+ | All official |
| Email | Resend | latest | 3k/mo free, official CF tutorial |
| Video | `@stream-io/video-react-sdk` | 1.34+ | `livestream` call type |
| Chat | `stream-chat-react` | 13.14+ | `livestream` channel type |
| UI | shadcn/ui | latest registry | New York style |
| CSS | Tailwind | v4 | OKLCH colors |
| Wrangler | `wrangler` | 4.x+ | `wrangler.jsonc` format |
| Lint/format | Biome | latest | Replaces ESLint+Prettier |
| Package mgr | pnpm | 9+ | Bun has Wrangler edge cases |
| Task runner | Turborepo | latest | Comes with BTS |
| Compatibility | `compatibility_date: 2026-05-01`, flag `nodejs_compat` | — | OpenNext requires |

---

## Storage layout (one Cloudflare account)

| Resource | Name | Purpose |
|---|---|---|
| D1 | `howlcast-db` | Users, sessions, channel config, panels, invites, mods, emote sources, audit log |
| KV | `HOWLCAST_EMOTES` | Emote metadata cache, Twitch app token, rate limit |
| KV (optional) | `HOWLCAST_SESSIONS` | Better Auth secondary cache |
| R2 | `howlcast-public` | Avatars, banners, panel images |
| R2 | `howlcast-isr` | OpenNext incremental cache |
| ~~R2~~ | ~~`howlcast-emotes`~~ | **REMOVED** — emote images load direct from provider CDNs (browser-cached). See `docs/integrations/emotes.md`. |
| Images | binding `IMAGES` | Avatar/banner resizing |
| Secrets | (Worker secrets) | `BETTER_AUTH_SECRET`, `STREAM_API_KEY`, `STREAM_API_SECRET`, `RESEND_API_KEY`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` |

---

## Repo file structure (after BTS scaffold)

```
howlcast/
├── apps/
│   ├── web/                          # howlcast.tv (Next.js)
│   │   ├── src/
│   │   │   ├── app/                  # Routes
│   │   │   │   ├── page.tsx          # Home
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── signup/page.tsx
│   │   │   │   ├── [username]/       # Channel page
│   │   │   │   ├── account/          # User profile
│   │   │   │   ├── admin/            # Broadcaster dashboard
│   │   │   │   └── setup/            # First-run wizard
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn components
│   │   │   │   ├── chat/             # Chat sidebar, message renderer
│   │   │   │   ├── player/           # GetStream wrapper
│   │   │   │   ├── emote/            # Emote, hover card
│   │   │   │   └── channel/          # Panels, info row
│   │   │   ├── lib/
│   │   │   │   ├── auth-client.ts    # Better Auth client
│   │   │   │   └── env.ts
│   │   │   └── styles/
│   │   │       └── globals.css       # Theme tokens
│   │   ├── public/
│   │   ├── components.json           # shadcn config
│   │   ├── next.config.ts
│   │   ├── open-next.config.ts
│   │   ├── wrangler.jsonc
│   │   └── package.json
│   │
│   └── server/                       # api.howlcast.tv (Hono)
│       ├── src/
│       │   ├── index.ts              # Hono entry
│       │   ├── scheduled.ts          # Cron handler
│       │   ├── routers/              # tRPC
│       │   │   ├── index.ts          # appRouter
│       │   │   ├── stream.ts
│       │   │   ├── emotes.ts
│       │   │   ├── channel.ts
│       │   │   ├── admin.ts
│       │   │   └── invites.ts
│       │   ├── lib/
│       │   │   ├── trpc.ts
│       │   │   ├── context.ts
│       │   │   ├── auth.ts           # Better Auth factory
│       │   │   ├── stream.ts         # GetStream JWT signer + REST
│       │   │   └── emotes/           # Per-provider fetchers
│       │   └── db/
│       │       ├── index.ts
│       │       ├── migrations/
│       │       └── schema/
│       │           ├── auth.ts       # Auto-generated by Better Auth
│       │           ├── channel.ts
│       │           ├── stream.ts
│       │           └── emotes.ts
│       ├── drizzle.config.ts
│       ├── wrangler.jsonc
│       └── package.json
│   │
│   └── docs/                         # docs.howlcast.tv (Astro + Starlight)
│       │                             # ← ADDED IN PHASE 7
│       ├── src/
│       │   ├── content/docs/         # all the .mdx pages
│       │   ├── styles/custom.css     # navy/cyan theme override
│       │   ├── components/
│       │   └── assets/               # screenshots, logo, diagrams
│       ├── astro.config.mjs
│       ├── public/
│       ├── wrangler.jsonc
│       └── package.json
│
├── bts.jsonc                         # Better-T Stack config
├── biome.json
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
├── README.md
├── CLAUDE.md
├── START-HERE.md
├── DESIGN-DECISIONS.md
├── PROGRESS.md
├── PRE-FLIGHT.md
├── docs/
│   ├── architecture.md (this file)
│   ├── build-plan.md
│   ├── branding-spec.md                 # White-label + PP/TOS detailed spec
│   ├── decisions.md
│   ├── docs-site.md                     # Phase 7: public docs site plan
│   ├── roles-and-notifications.md       # Roles + isInvited flag + Discord webhooks
│   └── integrations/
│       ├── getstream.md
│       ├── better-auth.md
│       └── emotes.md
├── design-handoff/                      # Final design (HTML mockups from Claude Design)
│   ├── HANDOFF-README.md
│   ├── design-chat-transcript.md
│   └── project/
│       ├── HowlCast.html, Dashboard.html, Account.html
│       ├── Email.html, Notifications.html, Emotes.html
│       ├── Stats.html, StreamKey.html, Panels.html
│       ├── shared.css                   # ← DESIGN TOKENS, port to globals.css
│       └── dash-shell.css
└── assets/
    ├── logo-variants.html               # 6 logo options to pick from
    └── logos/                           # SVG files
```

---

## Database schema

Better Auth generates `user`, `session`, `account`, `verification`, `twoFactor`, `passkey` tables automatically. We add these on top:

```ts
// apps/server/src/db/schema/channel.ts
import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  pronouns: text("pronouns"),
  avatarKey: text("avatar_key"),                  // R2 key
  bannerKey: text("banner_key"),
  verified: integer("verified", { mode: "boolean" }).default(false),
  // Two roles only — no mods, no subscribers
  role: text("role", { enum: ["broadcaster", "viewer"] })
    .notNull().default("viewer"),
  // Single permission flag — replaces all tier/subscriber logic.
  // Invited viewers can: post in chat (always), watch private streams (when broadcaster is in private mode).
  isInvited: integer("is_invited", { mode: "boolean" }).notNull().default(false),
  invitedAt: integer("invited_at", { mode: "timestamp_ms" }),
  invitedBy: text("invited_by"),                  // broadcaster userId who sent the invite
}, (t) => ({
  roleIdx: index("profiles_role_idx").on(t.role),
  invitedIdx: index("profiles_invited_idx").on(t.isInvited),
}));

export const channelConfig = sqliteTable("channel_config", {
  id: text("id").primaryKey().default("site"),    // single row, always "site"
  ownerId: text("owner_id").notNull().references(() => user.id),
  title: text("title"),
  visibility: text("visibility", { enum: ["public", "invite_only"] })
    .notNull().default("public"),
  matureContent: integer("mature", { mode: "boolean" }).default(false),
  liveStartedAt: integer("live_started_at", { mode: "timestamp_ms" }),
  liveEndedAt: integer("live_ended_at", { mode: "timestamp_ms" }),
  streamCallId: text("stream_call_id"),
  chatChannelCid: text("chat_channel_cid"),
  setupCompletedAt: integer("setup_completed_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const panels = sqliteTable("panels", {
  id: text("id").primaryKey(),
  position: integer("position").notNull(),
  title: text("title"),
  body: text("body"),                             // markdown
  imageKey: text("image_key"),
  linkUrl: text("link_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (t) => ({ posIdx: index("panels_position_idx").on(t.position) }));

export const invites = sqliteTable("invites", {
  code: text("code").primaryKey(),
  createdBy: text("created_by").notNull().references(() => user.id),
  usedBy: text("used_by").references(() => user.id),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
  maxUses: integer("max_uses").notNull().default(1),
  useCount: integer("use_count").notNull().default(0),
  // No preassignRole — accepting an invite always sets isInvited = true
});

export const webhooks = sqliteTable("webhooks", {
  id: text("id").primaryKey(),                    // 'public' | 'private'
  url: text("url"),                               // null = not configured
  notifyOnLive: integer("notify_on_live", { mode: "boolean" }).default(true),
  notifyOnEnd: integer("notify_on_end", { mode: "boolean" }).default(true),
  lastFiredAt: integer("last_fired_at", { mode: "timestamp_ms" }),
  lastError: text("last_error"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// White-label settings — single row, id='site'
export const whiteLabel = sqliteTable("white_label", {
  id: text("id").primaryKey().default("site"),
  customLogoKey: text("custom_logo_key"),         // R2 key, null = use default
  customPlatformName: text("custom_platform_name"),// null = "HowlCast"
  footerAttribution: text("footer_attribution", { enum: ["default", "custom", "off"] })
    .notNull().default("default"),
  customFooterText: text("custom_footer_text"),   // used when footerAttribution = "custom"
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// Privacy + Terms — two rows, ids = 'privacy' | 'terms'
export const legalDocs = sqliteTable("legal_docs", {
  id: text("id").primaryKey(),                    // 'privacy' | 'terms'
  bodyHtml: text("body_html").notNull(),          // sanitized rich text from WYSIWYG
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const userBans = sqliteTable("user_bans", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  reason: text("reason"),
  bannedBy: text("banned_by").notNull().references(() => user.id),
  bannedAt: integer("banned_at", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),  // null = permanent
});

export const emoteSources = sqliteTable("emote_sources", {
  id: text("id").primaryKey(),
  provider: text("provider", { enum: ["7tv", "bttv", "ffz", "twitch"] }).notNull(),
  scope: text("scope", { enum: ["channel", "global"] }).notNull(),
  externalId: text("external_id"),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  lastFetchedAt: integer("last_fetched_at", { mode: "timestamp_ms" }),
  lastError: text("last_error"),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull().references(() => user.id),
  action: text("action").notNull(),
  targetId: text("target_id"),
  metadata: text("metadata"),                     // JSON blob
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (t) => ({ actorIdx: index("audit_actor_idx").on(t.actorId) }));
```

---

## Why split workers, not one

**Default BTS behavior:** scaffolds Next.js (web) and Hono (server) as **two separate Workers**. There's no flag to mount Hono inside the Next.js Worker.

**The original plan** assumed single-Worker same-origin to avoid CORS pain. **BTS solves CORS for you out of the box** with:

1. Hono's `cors({ origin, credentials: true })` middleware (one line, pre-wired)
2. Better Auth's `crossSubDomainCookies` config (one block, in `auth.ts`)
3. `credentials: "include"` in the auth client (already set)

**So the cost of split is:** two `wrangler deploy` commands (Turbo runs them in parallel anyway), two domains in DNS, and using `partitioned: true` on cookies for Safari ITP.

**The benefit of split is:** independent deploys, independent scaling, independent debugging, sticking to BTS conventions so `bts add` works for future addons.

**Decision: accept the split. Don't fight the framework.**

If Safari ITP becomes a real problem in beta, we'll merge them later. It hasn't been a real problem for anyone using this pattern in 2026.

---

## Cookie config (the key block)

Add this to `apps/server/src/lib/auth.ts` inside `betterAuth({...})`:

```ts
advanced: {
  crossSubDomainCookies: {
    enabled: true,
    domain: ".howlcast.tv",
  },
  defaultCookieAttributes: {
    sameSite: "none",
    secure: true,
    httpOnly: true,
    partitioned: true,    // Safari ITP / Chrome CHIPS
  },
},
```

Without `partitioned: true`, Safari will silently break your auth in private/strict modes. Don't forget it.
