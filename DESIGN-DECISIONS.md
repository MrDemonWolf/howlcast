# Design Decisions — Final, Locked

> Pulled from the Claude Design handoff in `design-handoff/`. Everything below is the **final state** after all your iterations. Don't second-guess these — Claude Code will treat them as truth.

## Quick scan: what's IN, what's OUT

### IN

- **Den layout only** (Variation A) — classic two-column, sticky chat right, scrollable left
- **Single broadcaster** (you only) — single-tenant install
- **Public / Private stream toggle** — controlled per stream
- **Public stream** = anyone watches + reads chat, **only invited can post**
- **Private stream** = only invited can watch *or* chat
- **Two Discord webhooks** — public stream URL + private stream URL (only broadcaster setup needed)
- **Viewer Account page** — viewers get just: display name, pronouns, profile picture, basic email login + 2FA + sessions
- **Broadcaster Dashboard** — full streaming admin (Stream, Stats, Panels, Emotes, Invite emails, Stream key, Notifications, Self-host status, Account)
- **Streamer Mode toggle** in dashboard — auto-on when live, hides invite emails / sender addresses / sensitive info
- **White-label feature** — custom logo + name, footer "Powered by HowlCast by MrDemonWolf, Inc." OR custom company name
- **Bare-minimum PP / TOS** — settings-driven, simple WYSIWYG editor in dashboard
- **Default email template** — single "private stream invite" template (sent before going live)
- **Pop-out chat button** — for OBS browser source
- **Animated counters** in dashboard
- **Furry-themed dummy chat names** — silver_fox, paw_print_22, tundra, embers, hex_husky, moonbark, aurora, kit
- **Verified mark** — custom cyan starburst (NOT Twitter blue, NOT Twitch purple)
- **Howl Arc logo** — chosen brand mark (broadcast arcs from a wolf snout). Final files in `assets/logos/`:
  - `howlcast-mark.svg` — primary cyan mark (replaces placeholder `.brand-mark` in `shared.css`)
  - `howlcast-favicon.svg` — simplified for 16-32px (only 2 arcs, chunkier wedge)
  - `howlcast-wordmark.svg` — horizontal lockup with Bricolage Grotesque text
  - `howlcast-mark-white.svg` — pure white for photo/busy backgrounds
  - `howlcast-mark-on-cyan.svg` — navy-on-cyan tile, for cyan callouts

### Setup-time decisions (NEW)

- **Twitch user ID is the single setup input.** First-run wizard asks for nothing else identity-wise. From the Twitch ID HowlCast seeds: display name, bio, profile picture (downloaded to R2 once), and pulls channel emotes from all 4 providers (Twitch + 7TV + BTTV + FFZ). Broadcaster can edit any seeded field afterward.
- **No R2 emote image proxy.** Emote images load directly from each provider's CDN. Browsers cache them via HTTP headers. CSP whitelist for the 4 CDN hosts is the only cost. KV caches metadata only (name → CDN URL map), refreshed by cron every 12 hours, plus a manual "Refresh emotes now" button in Dashboard → Channel → Emotes.
- **Twitch global emotes are included** alongside broadcaster's channel emotes. Channel emotes (including subscriber-tier ones) are fine to expose — broadcaster opts in by virtue of running their own platform.

### OUT

- ❌ **Theater layout** — removed, only Den remains
- ❌ **Editorial layout** — removed, only Den remains
- ❌ **Mods role** — broadcaster handles all moderation directly (GetStream's built-in tools)
- ❌ **Subscriber tiers** — fully removed, no tier 1, no tier 2, no $3/mo, no $8/mo (per your latest instruction)
- ❌ **Subscribe button** — gone from channel page
- ❌ **Schedule** — removed from nav (panels still cover it informally)
- ❌ **Vods tab** — no recordings, live only
- ❌ **Tags** — removed (single-streamer platform doesn't need discovery tags)
- ❌ **Follow button** — invite-only doesn't need follows
- ❌ **Channel URL field** — single-tenant install means no `/{channel}` routing
- ❌ **Bell notification icon** — removed
- ❌ **New subs stat** — removed from dashboard
- ❌ **CPU health cell** — removed from dashboard
- ❌ **Mod queue** — gone
- ❌ **Recent activity sidebar** — gone
- ❌ **Channel polish row** — gone
- ❌ **Multi-channel notifications** — no email/RSS/web push fanout, just two Discord webhooks
- ❌ **Sub thank-you / starting / request templates** — only "Private stream invite" remains
- ❌ **Discord row in email feature block** — gone
- ❌ **"New template" button** in email sidebar — gone
- ❌ **Ko-fi tip events / raid events** — gone (out of scope for v1)
- ❌ **The Den card** in account sidebar — replaced with "Joined April 2026" line
- ❌ **"paw_print_22 · viewer · the howl" subtitle** in account header — gone
- ❌ **H.265/H.264 tag** in dashboard On-air header — gone
- ❌ **Scene · coding · sm7b chip** in preview — gone
- ❌ **"↑ 6.5 Mbps · 0 drop" chip** in preview — gone
- ❌ **1,247 viewer chip** in preview overlay (kept as side stat instead)

## Roles — final model

```
┌─────────────────────────────────────────┐
│  BROADCASTER ──────────────  VIEWER     │
│  (you, the only one)         (everyone) │
└─────────────────────────────────────────┘
```

**Two roles. No mods. No tiers.**

The "invite" is what gates **chat posting** (always) and **private-stream watching** (when broadcaster is in private mode). One single permission flag on the user record: `is_invited: boolean`.

## Pages — final structure

### Channel page (HowlCast.html)
- Two-column desktop, sticky chat right, scrollable left
- Player on top of left column
- Streamer info row directly below (avatar, name, verified, title)
- Panels grid (3 col → 2 col → 1 col responsive)
- Chat dock right (340–360px), pop-out button in chat header
- **Public mode chat:** read-only, input replaced with "Chat is invite-only · DM mrdemonwolf to join the den" CTA card
- **Private mode chat:** full chat with input
- Mobile: collapses to single column, chat moves below panels

### Dashboard (Dashboard.html) — broadcaster only
Sidebar nav structure (locked, matches design screenshots):
```
[Avatar · MrDemonWolf · BROADCASTER]
[On air · 02:14 · End button]

LIVE
  ◯ Stream      ← active
  ◯ Stats

CHANNEL
  ◯ Panels
  ◯ Emotes
  ◯ Invite emails
  ◯ Stream key
  ◯ Notifications

SERVER
  ◯ Branding         ← NEW: logo, platform name, footer, PP/TOS
  ◯ Self-host status
  ◯ Account
```

### Account page (Account.html) — viewer only
Three sections:
1. **How you appear** — display name, pronouns, profile picture
2. **Login & security** — email, password, two-factor (TOTP)
3. **Active sessions** — current + other sessions, sign-out remotely
4. **Danger zone** — delete account / leave the den

That's it. No channel URL, no mod settings, no notifications config (broadcaster owns those).

### Email templates (Email.html)
**One template only:** Private stream invite
- Subject: `You're on the list for {{date}} 🐺`
- Sent: before going live, only to invited viewers
- Body: invite copy, stream details, magic link tied to email
- Footer: "Self-hosted on mrdemonwolf.com infrastructure · no trackers · unsubscribe"

### Notifications page (Notifications.html) — broadcaster
**Two cards only:**
1. **Public stream webhook** — Discord URL, "Notify when live" toggle, "Notify when ended" toggle, test button
2. **Private stream webhook** — same but separate URL
3. **Discord embed preview** — what it'll look like in Discord

Nothing else. No multi-channel fanout. No throttling. No per-event grid.

### Other dashboard pages
- **Stats** — 7-day audience analytics
- **Panels** — drag/edit/add/delete the channel page panels
- **Emotes** — flat emote library (no tier headers, no subscriber gates)
- **Stream key** — RTMPS URL, key (masked + reveal), regenerate, OBS preset
- **Self-host status** — server health (uptime, RAM, disk, transcoder, version)
- **Account (broadcaster)** — broadcaster's own profile (separate from viewer Account.html)

## White-label feature — broadcaster setting

**Full spec:** [`docs/branding-spec.md`](docs/branding-spec.md) — read this when building.

Lives in **Dashboard → Server → Branding** (its own page, sits above Self-host status).

Three sections on one page:

1. **Logo & platform name**
   - Custom logo upload (overrides HowlCast brand mark site-wide)
   - Custom platform name (overrides "HowlCast" wordmark)
   - Live preview at top of page
2. **Footer attribution**
   - Default: "Powered by HowlCast by MrDemonWolf, Inc."
   - Custom: free-text 80 chars
   - Off: requires HowlCast Pro license (TBD whether v1 has this — for now, available but with notice)
3. **Privacy & Terms**
   - Tab switcher (Privacy / Terms)
   - Tiptap WYSIWYG editor (bold, italic, H1, H2, lists, link, undo/redo)
   - Sanitized on save (rehype-sanitize)
   - Renders at `/privacy` and `/terms` (auto-linked in footer)
   - Default content seeded with placeholder + "review before going live" warning banner

Renders site-wide:
- Brand mark in nav (channel + dashboard)
- Email template branding
- Footer on every page
- OG images (regenerated when logo changes)
- `<title>` tag prefix
- Favicon + Apple touch icons

## PP / TOS — bare minimum

**Full spec:** [`docs/branding-spec.md`](docs/branding-spec.md) (Section 3 of Branding page).

Lives in **Dashboard → Server → Branding** as a tab section on the same page as logo + footer settings.

- **Tiptap WYSIWYG editor** — bold, italic, H1/H2, ordered + unordered lists, link, undo/redo
- Renders at `/privacy` and `/terms` (public, no auth)
- Auto-linked from the global footer
- Default content seeded on first run (generic placeholder text with "review before launch" banner)
- Sanitized on save with rehype-sanitize (no script injection, no inline styles, no embeds)
- No version history, no per-jurisdiction logic — just two editable HTML docs in `legalDocs` table

## Database schema — synced to design

The role/tier model collapses with subscribers gone:

```ts
// profiles
{
  userId: string,
  displayName: string,
  bio: string | null,
  pronouns: string | null,
  avatarKey: string | null,    // R2 key
  bannerKey: string | null,
  verified: boolean,
  role: 'broadcaster' | 'viewer',
  isInvited: boolean,           // ← single flag, replaces tier system
  invitedAt: Date | null,
  invitedBy: string | null,     // broadcaster userId
}

// channelConfig (single row, id='site' since single-tenant)
{
  id: 'site',
  visibility: 'public' | 'invite_only',
  title: string,
  // ...
}

// webhooks (two rows, seeded on install)
{
  id: 'public' | 'private',
  url: string | null,
  notifyOnLive: boolean,
  notifyOnEnd: boolean,
  lastFiredAt: Date | null,
  lastError: string | null,
}

// whiteLabel (single row, id='site')
{
  id: 'site',
  customLogoKey: string | null,
  customPlatformName: string | null,
  footerAttribution: 'default' | 'custom' | 'off',
  customFooterText: string | null,
}

// legalDocs (two rows, ids = 'privacy' | 'terms')
{
  id: 'privacy' | 'terms',
  bodyHtml: string,
  updatedAt: Date,
}
```

**Removed tables:** `mod_assignments`, `subscriber_tiers`, anything tier-related.

## Cyan discipline (locked, do not violate)

Cyan appears ONLY on:
- Primary CTA buttons (filled cyan)
- Focus rings (3px glow with 0.18 alpha)
- Brand mark (the H tile, or whichever logo variant you pick)
- Verified checkmark (cyan starburst circle)
- Pinned message strip (cyan-soft gradient + cyan left border)
- Inline emote tooltip accents
- "Live" indicator stripe in chat sidebar (the broadcaster's name color in chat)

Cyan NEVER paints large backgrounds. Cyan is rare and meaningful.

## Files to reference

When building, Claude Code should pull from:

- **`design-handoff/project/HowlCast.html`** — channel page (live + offline)
- **`design-handoff/project/Dashboard.html`** — dashboard shell
- **`design-handoff/project/Account.html`** — viewer account
- **`design-handoff/project/Email.html`** — invite email template
- **`design-handoff/project/Notifications.html`** — Discord webhooks setup (already trimmed to 2-webhook design)
- **`design-handoff/project/Emotes.html`** — emote library (subscriber tiers stripped)
- **`design-handoff/project/Stats.html`** — audience analytics
- **`design-handoff/project/StreamKey.html`** — RTMPS + key + OBS preset
- **`design-handoff/project/Panels.html`** — panel editor
- **`design-handoff/project/shared.css`** — design tokens (DON'T re-derive these, just port them to globals.css)
- **`design-handoff/project/dash-shell.css`** — dashboard layout shell
- **`design-handoff/project/panels-editor.jsx`** — React panels editor reference
- **`design-handoff/project/tweaks-panel.jsx`** — Tweaks panel reference (probably skip, prototype-only)
- **`design-handoff/design-chat-transcript.md`** — full design decision log

The HTML files are **prototypes**, not production code. Claude Code's job: recreate them pixel-perfectly in Next.js + shadcn + Tailwind v4. Match the visual output; don't copy the prototype's internal structure.
