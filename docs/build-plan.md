# Build Plan

> **TL;DR:** 6 phases, ~6–8 weeks full-time or 3–4 months casual. Don't skip ahead — phase dependencies are real.

## What you'll find here

The complete checklist for building HowlCast, organized by phase. Each phase ends with a working, demoable thing.

---

## The 6 phases at a glance

```
Phase 1 ─► Phase 2 ─► Phase 3 ─► Phase 4 ─► Phase 5 ─► Phase 6 ─► Phase 7
FOUNDATION  AUTH      STREAM     CHAT/EMOTE ADMIN      POLISH     DOCS SITE
(~1 wk)    (~1 wk)    (~1.5 wk)  (~2 wk)    (~1.5 wk)  (~1 wk)    (~1 wk)
```

| Phase | Done = | Demo |
|---|---|---|
| 1 | Scaffold runs, dev server boots, theme looks right | Black-on-navy Card on a custom domain |
| 2 | Login works (4 methods + 2FA) | Sign in, see "Welcome [name]" |
| 3 | Channel page renders, OBS push works | Open OBS, stream visible to viewer |
| 4 | Chat works with emotes | Type message in one tab, see it with emotes in another |
| 5 | All admin pages built | Toggle visibility, manage panels, ban a user |
| 6 | Wizard works, errors handled, deploys auto | Fresh deploy → walk through wizard → ship |
| 7 | Public docs site live | Stranger reads docs, deploys their own copy in 30 min |

**Phase 7 details live in [`docs/docs-site.md`](docs-site.md).**

---

## Phase 1 — Foundation

**Goal:** working dev environment, theme applied, deployable.

- [ ] **1.1** Install Node 20+ and pnpm 9+ if missing
- [ ] **1.2** Install Wrangler globally + `wrangler login`
- [ ] **1.3** Run BTS scaffold:
```bash
pnpm create better-t-stack@latest howlcast \
  --frontend next \
  --backend hono \
  --runtime workers \
  --api trpc \
  --database sqlite \
  --orm drizzle \
  --db-setup d1 \
  --auth better-auth \
  --addons turborepo biome husky \
  --package-manager pnpm \
  --web-deploy cloudflare \
  --server-deploy cloudflare \
  --yes
```
- [ ] **1.4** `cd howlcast && pnpm install`
- [ ] **1.5** `git init && git add -A && git commit -m "scaffold from better-t-stack 3.27"`
- [ ] **1.6** Create Cloudflare resources:
  - `wrangler d1 create howlcast-db` → paste `database_id` into `apps/server/wrangler.jsonc`
  - `wrangler r2 bucket create howlcast-public`
  - `wrangler r2 bucket create howlcast-emotes`
  - `wrangler r2 bucket create howlcast-isr`
  - `wrangler kv namespace create HOWLCAST_EMOTES`
- [ ] **1.7** Edit `apps/web/wrangler.jsonc`: add R2 buckets (`howlcast-public`, `howlcast-isr`), KV (`HOWLCAST_EMOTES`), Images binding
- [ ] **1.8** Run `pnpm --filter web cf-typegen` to regen `CloudflareBindings`
- [ ] **1.9** Edit `apps/server/wrangler.jsonc`: D1 binding from 1.6, `howlcast-emotes` R2, KV, `triggers.crons = ["0 */6 * * *"]`
- [ ] **1.10** Edit `apps/web/open-next.config.ts`: add `r2IncrementalCache` + `d1NextModeTagCache`
- [ ] **1.11** Replace `@theme` block in `apps/web/src/styles/globals.css` with navy/cyan OKLCH tokens (from design system output)
- [ ] **1.12** Add Better Auth plugins to `apps/server/src/lib/auth.ts`: `username`, `twoFactor`, `passkey`, `magicLink`
- [ ] **1.13** Wire Resend into `magicLink.sendMagicLink` callback
- [ ] **1.14** Mirror plugins in `apps/web/src/lib/auth-client.ts`
- [ ] **1.15** Run `pnpm --filter server auth:generate` to regen schema
- [ ] **1.16** Run `pnpm --filter server db:generate && pnpm --filter server db:migrate` (local)
- [ ] **1.17** Set local secrets in `apps/server/.dev.vars`:
```
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001
RESEND_API_KEY=...
STREAM_API_KEY=...
STREAM_API_SECRET=...
TWITCH_CLIENT_ID=...
TWITCH_CLIENT_SECRET=...
```
- [ ] **1.18** Add `crossSubDomainCookies` config to Better Auth (see [`docs/architecture.md`](architecture.md))
- [ ] **1.19** `pnpm dev` — confirm web boots on `:3001`, server on `:3000`
- [ ] **1.20** First deploy: `pnpm deploy` from each app — confirm both load on `*.workers.dev`
- [ ] **1.21** Buy domain (`howlcast.tv` or chosen alternative) through Cloudflare Registrar
- [ ] **1.22** Attach custom domains: `howlcast.tv` → web, `api.howlcast.tv` → server
- [ ] **1.23** Apply migrations to remote D1: `wrangler d1 migrations apply howlcast-db --remote`
- [ ] **1.24** Commit: `phase 1 complete`

**Done when:** `https://howlcast.tv` loads with the navy theme, `https://api.howlcast.tv/health` returns ok.

---

## Phase 2 — Auth

**Goal:** all four sign-in methods + 2FA work end-to-end.

- [ ] **2.1** Build `/login` page — tabs: Email | Username | Magic Link | Passkey
- [ ] **2.2** Build `/signup` page — username, email, password, optional invite code
- [ ] **2.3** Build `/auth/callback` for magic link landing
- [ ] **2.4** Test email + password sign in
- [ ] **2.5** Test username + password sign in
- [ ] **2.6** Test magic link (real email via Resend)
- [ ] **2.7** Test passkey enroll + sign in **on real domain** (NOT `*.workers.dev` — public suffix list rejects it)
- [ ] **2.8** Build `/account/security` page — 2FA enroll with QR (`react-qr-code` from `totpURI`), passkey list, backup codes display
- [ ] **2.9** Test 2FA enroll + verify on next login
- [ ] **2.10** Build `/account` page — display name, bio, avatar upload
- [ ] **2.11** Add session middleware to tRPC context
- [ ] **2.12** Add role check helper: `requireBroadcaster()`, `requireMod()`, `requireAuth()`
- [ ] **2.13** Verify Safari/iOS works (test cookies on real device)
- [ ] **2.14** Commit: `phase 2 complete`

**Done when:** you can sign in with all 4 methods, 2FA prompts on next login, Safari works.

---

## Phase 3 — Channel & Streaming

**Goal:** OBS pushes RTMPS, viewer sees you live in browser.

**Single-tenant:** the channel page is `/` (root), not `/[username]`. There's only one streamer (you).

- [ ] **3.1** Add channel-related schema (profiles, channelConfig, panels, webhooks, whiteLabel, legalDocs) — see [`DESIGN-DECISIONS.md`](../DESIGN-DECISIONS.md) and [`docs/architecture.md`](architecture.md)
- [ ] **3.2** Generate + apply migrations
- [ ] **3.3** Sign up for GetStream, copy `STREAM_API_KEY` + `STREAM_API_SECRET` into Worker secrets
- [ ] **3.4** Write WebCrypto JWT signer (`signStreamUserToken`) — see [`docs/integrations/getstream.md`](integrations/getstream.md)
- [ ] **3.5** Write GetStream REST helpers: `createOrUpdateLivestreamCall`, `goLive`, `stopLive`, `upsertUser`, `assignChatRole`
- [ ] **3.6** Define two custom roles via REST: `broadcaster`, `viewer` (NO mod role — broadcaster handles all moderation)
- [ ] **3.7** Configure `livestream` Chat channel type grants — broadcaster has full perms, viewer has read+react, only invited viewers (`is_invited = true`) get post permission
- [ ] **3.8** tRPC procedures:
  - `stream.getViewerToken`
  - `stream.getBroadcasterToken`
  - `stream.getStreamCredentials` (RTMPS URL + key, broadcaster only)
  - `stream.isLive`
- [ ] **3.9** Webhook receiver at `/api/webhooks/getstream` with HMAC-SHA256 signature verification
- [ ] **3.10** Configure webhook URL in GetStream dashboard
- [ ] **3.10a** **Discord webhook firing logic:** on `call.live_started`, look up `channelConfig.visibility`, fire matching webhook (`public` or `private`). Reuse template from `Notifications.html` preview.
- [ ] **3.10b** Seed the `webhooks` table with two rows (`'public'` and `'private'`) on first run, both with `url = null` until configured
- [ ] **3.11** Build channel page at `/` — match `design-handoff/project/HowlCast.html` exactly (Den layout: two-column, sticky chat right, scrollable left)
- [ ] **3.11a** **Visibility check middleware:** if `channelConfig.visibility === 'invite_only'` AND `!viewer.isInvited`, redirect to `/not-invited`
- [ ] **3.12** Drop in `<LivestreamPlayer callType="livestream" callId="site" />` (single-tenant: callId is constant)
- [ ] **3.13** Build LIVE badge overlay (top-left, pulsing dot only — single keyframe animation)
- [ ] **3.14** Build viewer count chip (top-right, eye icon, mono font)
- [ ] **3.15** Build streamer info row (avatar + display name + cyan-starburst verified mark + title)
- [ ] **3.16** Build offline state banner (when `useIsCallLive()` false) — match `Den · Offline` design from prototype
- [ ] **3.17** Build panels grid (3 col → 2 col → 1 col responsive)
- [ ] **3.18** Build pop-out chat button (opens `/dashboard/chat` in popup window for OBS browser source)
- [ ] **3.19** Build public-mode chat: read-only, input replaced with "Chat is invite-only · DM mrdemonwolf to join the den" CTA
- [ ] **3.20** Build private-mode chat: full chat with input (only invited viewers can post; check `viewer.isInvited`)
- [ ] **3.21** **Test live flow end-to-end:** open OBS, push to RTMPS, watch in 3 browser tabs (one signed in as invited, one as public viewer, one logged out)
- [ ] **3.22** Commit: `phase 3 complete`

**Done when:** push from OBS → see yourself live in another browser within ~5 seconds. Public viewer sees read-only chat. Invited viewer can post.

---

## Phase 4 — Chat & Emotes

**Goal:** chat works with emotes from all 4 providers, smooth scrolling.

- [ ] **4.1** Programmatically create `livestream` Chat channel with ID = broadcasterId
- [ ] **4.2** Build chat sidebar component using `<Chat>` + `<Channel>` + `<VirtualizedMessageList>` + `<MessageInput>`
- [ ] **4.3** Apply theme overrides (CSS file targeting `.str-chat__*`)
- [ ] **4.4** Wrap in shadcn `Drawer` for mobile, fixed sidebar for desktop
- [ ] **4.5** Build emote pipeline cron handler in `apps/server/src/scheduled.ts`
- [ ] **4.6** Implement `getTwitchAppToken()` (cached in KV) and per-provider fetchers
- [ ] **4.7** Build merged emote map with priority: 7TV ch > BTTV ch > FFZ ch > Twitch sub > 7TV gl > BTTV gl > FFZ gl > Twitch gl
- [ ] **4.8** Store map in KV at `emotes:channel:{broadcasterId}` (TTL 24h)
- [ ] **4.9** Build R2-backed emote image proxy at `/api/emote-proxy/:provider/:id/:size`
- [ ] **4.10** Override `renderText` with rehype plugin for word-level emote matching
- [ ] **4.11** Render replaced tokens as `<EmoteWithTooltip>` (shadcn HoverCard preview)
- [ ] **4.12** Add `loading="lazy" decoding="async"` everywhere
- [ ] **4.13** Preload top 50 hot emotes via `<link rel="preload" as="image">` on chat connect
- [ ] **4.14** Test smooth scroll with 50+ emotes in view (Chrome perf tab)
- [ ] **4.15** Test moderation: ban, timeout, slow mode (built into GetStream)
- [ ] **4.16** Build chat for offline state — should still be open as a community chat (Decision #4)
- [ ] **4.17** Commit: `phase 4 complete`

**Done when:** type `wolfHowl` in chat, see the emote render with hover preview, scroll stays smooth.

---

## Phase 5 — Broadcaster Dashboard

**Goal:** all broadcaster admin functions work from the dashboard. Match `design-handoff/project/Dashboard.html` and sibling pages.

**Sidebar structure (locked):**
```
LIVE     → Stream, Stats
CHANNEL  → Panels, Emotes, Invite emails, Stream key, Notifications
SERVER   → Branding, Self-host status, Account
```

- [ ] **5.1** Build `/dashboard/*` route group + middleware (broadcaster role only)
- [ ] **5.2** Build dashboard shell layout (sidebar + main panel) — matches `design-handoff/project/dash-shell.css`
- [ ] **5.3** Header chrome: avatar + display name + BROADCASTER label + on-air pill (`02:14` elapsed) + End button
- [ ] **5.4** **Streamer Mode** toggle in header — auto-on when live, hides invite emails / sender addresses / sensitive info site-wide. Manual override available. Pulls from `streamerModeEnabled` in user prefs.
- [ ] **5.5** **Live → Stream** page — go live / stop, public/private visibility toggle, viewer count animated counter, chat-min counter, stream health (RAM, transcoder, bitrate — NO CPU, NO H.264 tag)
- [ ] **5.6** **Live → Stats** page — 7-day audience analytics, retention curve, peak concurrent, geo, devices
- [ ] **5.7** **Channel → Panels** page — drag/edit/add/delete the channel page panels (port `panels-editor.jsx` to React)
- [ ] **5.8** **Channel → Emotes** page — flat emote library, drag-to-reorder, upload zone, animated/static toggle (NO subscriber tier headers)
- [ ] **5.9** **Channel → Invite emails** page — port `Email.html` design, single "Private stream invite" template, sent before going live, magic-link tied to email
- [ ] **5.10** **Channel → Stream key** page — RTMPS URL, key (masked + reveal), regenerate, OBS preset import (.json file)
- [ ] **5.11** **Channel → Notifications** page — TWO Discord webhook cards (public + private), URL field + test button + on-live toggle + on-end toggle each. Plus Discord embed preview. **No multi-channel fanout, no Ko-fi/raid events, no throttling — just the two webhooks.**
- [ ] **5.12** **Server → Branding** page — see [`docs/branding-spec.md`](../docs/branding-spec.md) for full spec. Three sections: Logo & platform name, Footer attribution, Privacy & Terms (Tiptap WYSIWYG). All settings live-preview at the top of the page.
- [ ] **5.13** **Server → Self-host status** page — uptime, RAM, disk, transcoder workers, version, recent logs, restart button
- [ ] **5.14** **Server → Account (broadcaster)** page — broadcaster's own profile (display name, bio, sender email, avatar, banner) — separate from viewer Account
- [ ] **5.15** **Invite system** — create invite (single/multi-use, expiration), copy link, list invites, revoke. Invites are tied to email and grant `is_invited: true` on accept.
- [ ] **5.16** Build `/dashboard/chat` — chat-only fullscreen view for OBS browser source (with pop-out button on channel page)
- [ ] **5.17** Wire white-label site-wide (logo, platform name, footer attribution all reading from `whiteLabel` row)
- [ ] **5.18** Wire `/privacy` and `/terms` public routes to render `legalDocs.bodyHtml`
- [ ] **5.19** Commit: `phase 5 complete`

**Done when:** you can do everything from the dashboard without touching the database. The sidebar nav matches the design screenshots exactly. Branding settings update site-wide in real time.

**Reference:** [`DESIGN-DECISIONS.md`](../DESIGN-DECISIONS.md), [`design-handoff/project/`](../design-handoff/project/), [`docs/branding-spec.md`](../docs/branding-spec.md)

---

## Phase 6 — Polish & Launch

**Goal:** wizard works, viewer account page works, all white-label rendering verified, errors handled, ready to ship.

- [ ] **6.1** Build first-run setup wizard at `/setup` (7 steps — see [`docs/branding-spec.md`](../docs/branding-spec.md) for default content seeding)
- [ ] **6.2** Detect first-run state (no users in D1 OR `setupCompletedAt IS NULL`)
- [ ] **6.3** Lock wizard route after completion
- [ ] **6.4** Build **viewer Account page** at `/account` — match `design-handoff/project/Account.html` exactly. Just: Display name, pronouns, profile picture, email, password, 2FA (TOTP), active sessions, danger zone. NOTHING ELSE. Single-column layout, sidebar nav.
- [ ] **6.5** Verify white-label settings render correctly in:
  - Channel page nav (logo + platform name)
  - Dashboard nav (logo + platform name)
  - Email template header (logo + platform name)
  - Footer (attribution per setting)
  - `<title>` tag (platform name prefix)
  - OG image route (uses custom logo if set)
- [ ] **6.6** Verify `/privacy` and `/terms` routes render correctly with sanitized HTML
- [ ] **6.7** Add `error.tsx` to every route group
- [ ] **6.8** Add `not-found.tsx`
- [ ] **6.9** Add `loading.tsx` skeletons
- [ ] **6.10** Wire Sonner toasts for all mutations
- [ ] **6.11** Build OG image route via `@vercel/og` — uses white-label logo + platform name if set
- [ ] **6.12** Add favicon + Apple touch icons (regenerated from current logo on logo change)
- [ ] **6.13** Add `robots.txt` + `sitemap.xml`
- [ ] **6.14** Add Cloudflare Web Analytics
- [ ] **6.15** Add `/api/health` endpoint (D1 ping + KV ping + GetStream ping)
- [ ] **6.16** Set up GitHub Actions: typecheck + lint + drizzle generate verify + opennext build
- [ ] **6.17** Set up auto-deploy from `main` (Workers Builds OR manual)
- [ ] **6.18** Test on iPhone Safari, iPad, desktop (Chrome/Firefox/Safari), Android Chrome
- [ ] **6.19** Hard live test: real OBS push, 3 viewer tabs (invited + public + logged out), chat from a 4th
- [ ] **6.20** Write 1-page operations runbook (logs, key rotation, hotfix process)
- [ ] **6.21** Commit: `phase 6 complete — shipped`

**Done when:** fresh deploy walks through wizard cleanly, branding edits update site-wide in real time, viewer account page matches design, all monitoring works.

---

## Time estimates (be honest with yourself)

| Mode | Pace | Total |
|---|---|---|
| Full-time focused | ~40h/wk | 6–8 weeks |
| Sustainable side project | ~10h/wk | 3–4 months |
| Weekend warrior | ~4h/wk | 6+ months |

The longest phases are Auth (gotchas with Workers + cookies) and Chat/Emotes (multi-provider pipeline). Everything else is well-trodden.

**Don't try to parallelize phases.** They depend on each other for real reasons.
