# HowlCast Progress

> Update this as you go. Claude Code will read it to know where you are.

**Last updated:** 2026-05-01 (design locked from Claude Design handoff)
**Current phase:** Pre-Phase 1 (workspace setup)

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
- [ ] Migrations applied to remote D1

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

- [ ] `livestream` Chat channel created programmatically
- [ ] Chat sidebar (desktop) + drawer (mobile) wired
- [ ] Theme overrides applied to `stream-chat-react`
- [ ] Emote cron handler in `scheduled.ts`
- [ ] Twitch app token caching in KV
- [ ] 7TV / BTTV / FFZ / Twitch fetchers all working
- [ ] Merged emote map written to KV
- [ ] R2 emote image proxy at `/api/emote-proxy/:provider/:id/:size`
- [ ] `renderText` override with rehype emote plugin
- [ ] Emote hover preview (HoverCard)
- [ ] Chat scrolls smoothly with 50+ emotes per scroll

## Phase 5 — Broadcaster Dashboard

- [ ] `/dashboard/*` middleware (broadcaster only)
- [ ] Dashboard shell (sidebar + main panel) — matches `dash-shell.css`
- [ ] Header chrome (avatar, name, BROADCASTER label, on-air pill, End button)
- [ ] Streamer Mode toggle in header
- [ ] **Live → Stream** page (Go Live, public/private toggle, animated counters)
- [ ] **Live → Stats** page (7-day analytics)
- [ ] **Channel → Panels** page (drag/edit/add/delete)
- [ ] **Channel → Emotes** page (flat list, no tier headers)
- [ ] **Channel → Invite emails** page (single template)
- [ ] **Channel → Stream key** page (RTMPS + masked key + OBS preset)
- [ ] **Channel → Notifications** page (two Discord webhooks)
- [ ] **Server → Self-host status** page (uptime, RAM, disk, transcoder)
- [ ] **Server → Account (broadcaster)** page (broadcaster's own profile)
- [ ] Invite system (create, copy link, list, revoke)
- [ ] `/dashboard/chat` (OBS browser source)
- [ ] White-label settings (logo, name, footer attribution)
- [ ] PP / TOS WYSIWYG editor + `/privacy` + `/terms` routes

## Phase 6 — Polish & Launch

- [ ] First-run setup wizard
- [ ] Viewer Account page (`/account` — display name, pronouns, avatar, login, sessions)
- [ ] White-label rendering site-wide (brand mark, wordmark, footer)
- [ ] PP / TOS routes wired
- [ ] Error boundaries on every page
- [ ] 404 page
- [ ] Loading skeletons
- [ ] Sonner toasts for mutations
- [ ] OG images via `@vercel/og`
- [ ] Favicon + Apple touch icons
- [ ] robots.txt + sitemap
- [ ] Cloudflare Web Analytics
- [ ] `/api/health` endpoint
- [ ] CI: typecheck + lint + drizzle generate verify
- [ ] Auto-deploy from `main`
- [ ] Cross-browser tested (Safari, Chrome, Firefox, mobile)
- [ ] Live test with real OBS push
- [ ] Operations runbook written

## Phase 7 — Docs Site

_See [`docs/docs-site.md`](docs/docs-site.md) for the full plan._

- [ ] Domain decided (`docs.howlcast.tv` recommended)
- [ ] DNS record added in Cloudflare
- [ ] Starlight added via `bts add` (or manual scaffold)
- [ ] Custom theme (navy/cyan) applied
- [ ] Logo dropped in
- [ ] Landing page built (write fresh content following the design tokens in `design-handoff/project/shared.css`)
- [ ] Quickstart page written
- [ ] Deploy guide written (Cloudflare setup, D1/R2, secrets, first deploy)
- [ ] Configuration guides written (GetStream, Resend, Twitch, wizard)
- [ ] Operations guides written (going live, moderation, invites, panels)
- [ ] Troubleshooting pages written
- [ ] Reference docs written (env vars, architecture, schema, routes, webhooks)
- [ ] About + changelog
- [ ] OG images set up
- [ ] Screenshots taken from real deployment
- [ ] Search enabled (Pagefind)
- [ ] Analytics installed
- [ ] Deployed to `docs.howlcast.tv`
- [ ] Cross-links between main app and docs

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
