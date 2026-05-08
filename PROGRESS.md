# HowlCast Progress

> Update this as you go. Claude Code will read it to know where you are.

**Last updated:** 2026-05-08 (Phase 7 + ops runbook shipped)
**Current phase:** Phase 6 — only the hard live OBS test remains (Nathanial-side). Phase 7 docs site ready to deploy on first GH Pages enable.

---

## Pre-flight

### Design (✅ DONE)

- [x] Logo direction options ready (see [`assets/logo-variants.html`](assets/logo-variants.html))
- [x] Design system finalized (see [`design-handoff/project/shared.css`](design-handoff/project/shared.css))
- [x] Channel page mockup done (`design-handoff/project/HowlCast.html`)
- [x] Dashboard mockup done (`design-handoff/project/Dashboard.html`)
- [x] Viewer Account mockup done (`design-handoff/project/Account.html`)
- [x] Email template mockup done (`design-handoff/project/Email.html`)
- [x] All dashboard sub-pages done (Stats, Panels, Emotes, Notifications, StreamKey)
- [x] Subscriber tier removal complete (Emotes.html stripped)
- [x] Notifications page rewritten to two-Discord-webhook design
- [x] Design decisions locked in [`DESIGN-DECISIONS.md`](DESIGN-DECISIONS.md)

### Remaining decisions

- [x] **Logo variant picked** — Howl Arc (#03). All 5 final SVGs in `assets/logos/howlcast-*.svg`

### Account / workspace setup (Step-by-step in `PRE-FLIGHT.md`)

- [ ] Step 1: Cloudflare account + Wrangler CLI
- [ ] Step 2: Domain bought (`howlcast.tv` through Cloudflare Registrar)
- [ ] Step 3: GetStream account + API keys in 1Password
- [ ] Step 4: Resend domain verified (SPF/DKIM/DMARC)
- [ ] Step 5: Twitch dev app + keys in 1Password
- [ ] Step 6: 7TV / BTTV / FFZ channel IDs noted
- [ ] Step 7: Discord webhooks created (public + private)
- [ ] Step 8a: GitHub repo created (`mrdemonwolf/howlcast`)
- [ ] Step 8b: Jira project created (`HC` key, kanban board)
- [ ] Step 8c: Google Drive folder created (with subfolders)
- [ ] Step 8d: 1Password vault populated
- [ ] Step 8e: Cross-links between GitHub / Jira / Drive in place
- [ ] Step 9: Local dev tools verified

## Phase 1 — Foundation

- [x] BTS scaffold command run
- [x] D1 database created
- [x] R2 buckets created (2: public, isr — emotes bucket removed, images load direct from provider CDNs)
- [x] KV namespace created
- [x] `wrangler.jsonc` (web + server) updated with bindings
- [x] OpenNext `r2IncrementalCache` + `d1NextModeTagCache` configured
- [x] Theme tokens ported from `design-handoff/project/shared.css` into `apps/web/src/styles/globals.css`
- [x] Better Auth plugins added (username, twoFactor, passkey, magicLink)
- [x] Resend wired into magic link callback
- [x] Drizzle auth schema regenerated and migrated
- [x] Local secrets in `.dev.vars`
- [x] `crossSubDomainCookies` configured
- [x] `bun run dev` boots both workers locally
- [x] First deploy to a `*.workers.dev` URL works

## Phase 2 — Auth

- [x] Sign up / sign in pages built
- [x] Email + password works
- [x] Username login works
- [x] Magic link works (real email sent via Resend)
- [x] Passkey enroll + sign in works (on real domain, not `*.workers.dev`)
- [x] 2FA enroll + verify works
- [x] `/account/security` page complete
- [x] Migrations applied to remote D1

## Phase 3 — Channel & Streaming

- [x] Channel-related schema (profiles, channelConfig, panels, invites, webhooks, userBans) shipped (3A)
- [x] GetStream JWT signer (manual WebCrypto) — `packages/api/src/lib/stream.ts` (3B)
- [x] tRPC procedures: `stream.getViewerToken`, `getBroadcasterToken`, `getStreamCredentials`, `isLive` (3B)
- [x] Webhook receiver at `/api/webhooks/getstream` with HMAC verification (3B)
- [x] Channel page **= home page** (single tenant, no `/[username]`); player + chat slots wired to tRPC (3C)
- [x] LIVE badge + viewer chip (drives off `stream.isLive` polling) (3C)
- [x] Streamer info row with verified check + public/private mode pill (3C)
- [x] Panels grid below player (3C)
- [x] Discord fanout on `call.live_started` / `call.ended` / `call.session_ended` (3D)
- [ ] Real OBS test: RTMPS push works, stream visible to viewer (needs real STREAM_API_KEY/SECRET)
- [ ] GetStream Video + Chat SDKs wired into player/chat slots (Phase 4)

## Phase 4 — Chat & Emotes

- [x] `livestream` Chat channel provisioned via `channel.createCall` mutation
- [x] Chat sidebar (desktop) wired into channel page (mobile drawer follow-up)
- [x] Dark theme applied to `stream-chat-react` (str-chat\_\_theme-dark)
- [x] Emote cron handler in `apps/server/src/index.ts` (scheduled export)
- [x] Twitch app token caching in KV (key `twitch:apptoken`)
- [x] 7TV / BTTV / FFZ / Twitch fetchers all wired (fail-soft)
- [x] Merged emote map written to KV (`emotes:current`)
- [x] (skipped per design) ~R2 emote image proxy~ — direct CDN per DESIGN-DECISIONS.md
- [x] `renderText` override with rehype emote plugin
- [ ] Emote hover preview (HoverCard) — Phase 5 polish
- [ ] Chat scrolls smoothly with 50+ emotes per scroll — needs OBS test

## Phase 5 — Broadcaster Dashboard

- [x] First-run setup wizard at `/setup` (creates broadcaster account in one flow)
- [x] `/dashboard/*` broadcaster middleware (session + setup + role gate)
- [x] Dashboard shell (sidebar + main panel) — Tailwind port of dash-shell.css
- [x] Header chrome (avatar, BROADCASTER label, on-air pill, View channel link)
- [x] **Live → Stream** page (Provision + Go Live + RTMPS card + title/visibility)
- [x] **Channel → Panels** page (up/down reorder + add/edit/delete drawer)
- [x] **Channel → Emotes** page (merged grid + manual refresh)
- [x] **Channel → Invite emails** page (send + list + revoke; magic-link email)
- [x] **Channel → Stream key** page (RTMPS + masked key + reveal/copy)
- [x] **Channel → Notifications** page (two Discord webhooks + per-event toggles)
- [x] **Server → Self-host status** page (worker health URLs)
- [x] **Server → Account (broadcaster)** page (profile + link to /account/security)
- [x] Invite system (create, list, revoke, accept at `/invite/[code]`)
- [x] `/dashboard/chat` + `/popout/chat` (OBS browser source)
- [ ] **Live → Stats** page (7-day analytics) — Phase 6
- [ ] White-label settings (logo, name, footer attribution) — Phase 6
- [ ] PP / TOS WYSIWYG editor + `/privacy` + `/terms` routes — Phase 6
- [ ] Streamer Mode toggle in header — Phase 6 polish

## Phase 6 — Polish & Launch

- [x] First-run setup wizard (shipped in Phase 5.0)
- [x] `/api/health` endpoint
- [x] CI: typecheck + lint + format check
- [x] Auto-deploy from `main`
- [x] Sonner toasts for mutations (in use across all dashboard pages)
- [x] Favicon + Apple touch icons (layout.tsx already configures these)
- [x] **Live → Stats** dashboard page (7-day analytics)
- [x] **Streamer Mode toggle** in dashboard header (mask key + redact notifications + RTMPS URL)
- [x] Viewer `/account` page (display name, pronouns, sessions, danger zone)
- [x] White-label settings (logo, platform name, footer attribution) + rendering site-wide
- [x] `/privacy` + `/terms` routes (DB-backed via Tiptap WYSIWYG in dashboard)
- [x] Error boundaries (root + dashboard + global-error)
- [x] 404 page
- [x] Loading skeletons (root + dashboard)
- [x] OG images (channel home, /privacy, /terms via next/og ImageResponse)
- [x] robots.txt + sitemap.xml
- [x] Pre-Phase-6 code audit ([`AUDIT.md`](AUDIT.md))
- [x] Centralize brand hex tokens (`@howlcast/config`)
- [x] API helper dedupe + single drizzle-per-request
- [x] Drop public mode end-to-end (invite-only by design)
- [x] Branding logo served via Next.js route + optimized `<Image>`
- [x] Layout token scale (`--container-*`, `--gutter-x*`, `--section-y`, `--chat-dock-w`) in `globals.css`
- [x] 11 shadcn primitives added to `@howlcast/ui` (Card, Tabs, Dialog, Sheet, etc.)
- [x] Layout shells: `PageContainer`, `ChannelLayout`, `ContentSection`
- [x] Shared `LegalDocPage` (privacy + terms route dedupe)
- [x] Auth + viewer pages routed through `PageContainer`
- [x] Channel home page routed through `ChannelLayout`
- [x] Card primitive re-skinned to brand defaults + 9 dashboard surfaces swept onto Card/CardHeader/CardContent
- [x] Dashboard inline-style cleanup (header-strip, sidebar, overview, streamer-mode-toggle)
- [x] **Own analytics** — viewer + chat tracking via GetStream webhooks; per-session detail page (`/dashboard/stats/[id]`) with viewer-line + chat/min bar charts; migration 0009 (`chat_message_count`, `stream_viewer_snapshots`, `stream_chat_minutes`); 1-min cron sampler with 7-day prune
- [ ] Cross-browser tested (Safari, Chrome, Firefox, mobile)
- [ ] **Hard live OBS test** — RTMPS push, webhook fires, Discord fanout fires, channel page goes live
- [x] Operations runbook written ([`docs/operations.md`](docs/operations.md))

## Phase 7 — Docs Site

_See [`docs/docs-site.md`](docs/docs-site.md) for the live plan. Mirrors `MrDemonWolf/fangdash` setup._

- [x] Framework decided — **Fumadocs** (Next.js + MDX), mirroring fangdash
- [x] Hosting decided — **GitHub Pages** at `mrdemonwolf.github.io/howlcast`
- [x] `apps/docs` scaffolded with Fumadocs config + tsconfig + postcss + source.config
- [x] Custom theme (navy `#091533` + cyan `#0FACED`) in `app/global.css`
- [x] Landing page (hero, stats, feature grid, footer)
- [x] Quickstart page + Prerequisites
- [x] Deploy guides — Cloudflare setup, D1/R2, Secrets, First deploy
- [x] Configuration guides — First-run wizard, GetStream, Resend, Twitch+emotes, Branding, Notifications
- [x] Operations guides — Going live, Invites, Panels, Chat popout, Moderation, Streamer Mode, Analytics
- [x] Reference docs — Architecture, Schema, Env vars, tRPC routes, Webhooks, Design decisions
- [x] Troubleshooting — Common issues, OBS not pushing, Chat not working
- [x] Changelog (high-level by phase)
- [x] GitHub Actions workflow (`.github/workflows/deploy-docs.yml`)
- [ ] Repo Settings → Pages → Source: GitHub Actions (one-time, manual — see NEED_TO_DO.md)
- [ ] First push triggers initial build → site live at `https://mrdemonwolf.github.io/howlcast/`
- [ ] Real screenshots after first OBS stream
- [ ] Search (Pagefind) — deferred
- [ ] Custom domain `docs.howlcast.tv` — deferred

**Done when:** a stranger can read the docs and deploy their own HowlCast in under 30 minutes.

### "Coming soon" (optional, during Phase 6)

- [ ] Quick Starlight scaffold
- [ ] One-page placeholder landing
- [ ] Deploy to claim the URL

---

## Notes & blockers

_Add anything that's blocking you or worth remembering._

- (none yet)

## Decisions log

_Update [`docs/decisions.md`](docs/decisions.md) when you make a call on an open question._

- (none yet)
