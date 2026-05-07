# RESUME — current session state

> **Purpose:** if context gets compacted or a fresh Claude session picks up here, this single file gets you back to speed in under two minutes. PROGRESS.md tracks the build plan; this tracks the **conversation state** — what's mid-flight, what just shipped, what's next.

---

## Where we are

**Phase 5 shipped. Domain rename + OBS fix shipped. Go Live verification pending.**

All 9 dashboard pages live (Stream / Panels / Emotes / Invites / Stream key / Notifications / Status / Account / Chat + popout). First-run setup wizard creates the broadcaster account in one flow. /signup gone (invite-only). Login = single form.

**Recent (this session):**

- Workers renamed: `howlcast` → `tv`, `howlcast-api` → `tv-api`
- Custom domains: `tv.mrdemonwolf.com` (web) + `api.tv.mrdemonwolf.com` (api)
- Cookie fix: `crossSubDomainCookies` on `tv.mrdemonwolf.com` — resolves the post-setup ERR_TOO_MANY_REDIRECTS
- OBS fix: stream.provision now reads `ingress.rtmp.address` from GetStream + persists `channel_config.rtmps_url`. RtmpsCard reads from API instead of hardcoded URL
- Stepped dashboard walkthrough: `<StreamWizard />` (unprovisioned → ready → live)
- Migration 0005: `stream_sessions` table + `rtmps_url` column
- Webhook handles both `call.live_started` and `call.session_started`
- Sidebar cleaned: ghost links to Stats / Branding / Privacy/TOS removed (Phase 6 will add them back)

**Phase 6 (polish + Stats + Branding + Legal + viewer Account + OBS hardening) is the next phase.** Stats schema + webhook integration done; tRPC router + page pending.

**Live URLs:**

- Web: <https://tv.mrdemonwolf.com> (custom domain) + <https://tv.mrdemonwolf.workers.dev> (fallback)
- API: <https://api.tv.mrdemonwolf.com> (custom domain) + <https://tv-api.mrdemonwolf.workers.dev> (fallback)
- All `/api/health` return `{"ok":true}`. CI/Deploy via GH Actions, all secrets in place.

**Outstanding issues from end of session:**

1. **Go Live UI stuck at "Going live…"** — likely cause: GetStream webhook URL still points at dead `howlcast-api.mrdemonwolf.workers.dev` worker. User must update URL to `https://tv-api.mrdemonwolf.workers.dev/api/webhooks/getstream` in GetStream dashboard. NEED_TO_DO.md item.
2. **Channel page chat error** when broadcaster is logged in — error now surfaced inline ("Chat unavailable: …") instead of crashing. Root cause TBD — may be cross-domain token timing or stream-chat SDK race condition. Investigate next session.
3. **Wizard UX wolf/den motifs** — user requested "corp but furry" polish. Cosmetic, deferred.

**Next session — planned:**

- GetStream Video + Chat React SDK full audit (read all docs, compare to our channel-page / live-player / live-chat implementations)
- Write structured rewrite plan in `docs/getstream-rewrite-plan.md`
- Implement fixes once approved

**Repo:** <https://github.com/MrDemonWolf/howlcast> — public, default branch `main`. Pushed up through `be0eac2`. Branch protection enabled (no force-push, no deletion).

---

## Stack quick reference

- **Package manager:** **bun 1.3+**. Catalog in `package.json` `workspaces.catalog`. Run `bun install`, `bun run dev`, `bun run deploy` (NOT `bun deploy` — collides with bun's built-in).
- **Monorepo:** Turborepo. `apps/web` (Next.js 16 OpenNext), `apps/server` (Hono), `packages/{api,auth,db,env,infra,mail,ui,config}`.
- **Auth:** Better Auth 1.6.9 + plugins (`username`, `twoFactor`, `passkey` via `@better-auth/passkey`, `magicLink`).
- **Mail:** `@howlcast/mail` — Resend → SMTP/mailpit → console fallback.
- **DB:** Cloudflare D1 (`howlcast-db`). Drizzle ORM. Migrations in `packages/db/src/migrations/`. Latest migration: `0004_lean_nocturne.sql` (drops `allow_signups` after we removed `/signup` entirely).
- **Infra:** Alchemy 0.93. Resources declared in `packages/infra/alchemy.run.ts`. CI uses `CloudflareStateStore` (state in a Worker + Durable Object); local dev uses file-based store.
- **CI/CD:** `.github/workflows/{ci,deploy,update-license-year}.yml`. `oven-sh/setup-bun@v2.2.0`. Deploy chains via `workflow_run` after CI green on main. **All 10 secrets set** (cloudflare, alchemy, better-auth, stream, twitch).
- **Lint/format:** eslint + prettier (matches fangdash setup). Biome was removed.
- **Brand:** navy `#091533` + cyan `#0FACED` + Bricolage Grotesque + Geist. Dark only. Wolf-themed but understated. `assets/logos/howlcast-*.svg` + `apps/web/public/logos/*` are the brand assets.

---

## Critical decisions (don't relitigate)

- **Single broadcaster, single-tenant.** No `/[username]` route. The channel page IS the home page (`/`).
- **Two roles only:** broadcaster + viewer. One `is_invited` boolean replaces all tier/sub logic. No mods role (broadcaster moderates via GetStream's built-in tools).
- **Den layout only.** No theater, no editorial.
- **Two Discord webhooks** (public + private), DB-stored, edited from Dashboard → Notifications. **No other notification channels.**
- **Single email template:** "Private stream invite". No sub thank-you, raid alert, etc.
- **No R2 emote proxy.** Emote images load direct from provider CDNs (browser-cached). Only metadata is in KV.
- **Twitch ID = single setup input.** The first-run wizard at `/setup` resolves it via Helix and writes `channelConfig.broadcasterTwitchId`.
- **Cross-subdomain cookies are blocked on `*.workers.dev`** (Public Suffix List). Same-origin proxy via Next.js rewrites is the workaround. In prod (`howlcast.tv` + `api.howlcast.tv`), enable `crossSubDomainCookies` for cross-origin sessions.
- **No `/signup` route.** Setup creates the broadcaster account; viewers arrive via emailed magic-link invites only. `allowSignups` column was dropped in 0004.
- **No hardcoded `mrdemonwolf` user references.** `MrDemonWolf, Inc.` company branding in metadata is fine. Broadcaster's display name reads from DB.

---

## What's live (full feature surface)

### Public (`/`, `/login`, `/invite/[code]`, `/popout/chat`)

- Channel page (home) — branded chrome, real GetStream player + chat (lazy-loaded), LIVE badge polling, panels grid, public/private mode pill.
- `/login` — single-form sign-in (email+password primary, magic-link + passkey secondary, "use username instead" toggle).
- `/invite/[code]` — viewer onboarding. Signed-out: magic-link form. Signed-in: one-click accept → flips `profiles.isInvited`.
- `/popout/chat` — chrome-free chat for OBS browser source.

### First-run (`/setup`)

3-step wizard, single page state machine:

1. Twitch lookup → recap card with avatar + 7TV/BTTV/FFZ provider counts
2. Email + password + display name (with strength meter, inline email validation)
3. Visibility (Invite-only default)

Creates broadcaster account via `auth.api.signUpEmail`, writes `profiles` (broadcaster, verified, invited) + `channelConfig` row, sets session cookie, redirects to `/dashboard`. Locked once `setupCompletedAt` is set.

### Broadcaster (`/dashboard/*`)

Sidebar shell with 3 sections:

- **Live** → Stream (`/dashboard`): Provision call → Go live → End. RTMPS card + Title/visibility editor.
- **Channel** → Panels (drag-equiv reorder + drawer editor), Emotes (merged grid + manual refresh), Invite emails (send/list/revoke), Stream key (full RTMPS detail), Notifications (two Discord webhooks UI), Chat (popout-capable).
- **Server** → Self-host status, Account (broadcaster profile).

Three-tier middleware: session → setupCompleted → role=broadcaster.

### tRPC routers

- `setup` — `getStatus` (public query), `lookup` + `commit` (public mutations, locked after first run)
- `channel` — `getInfo` / `getPanels` / `getEmotes` (public), `createCall` / `updateConfig` / `upsertPanel` / `deletePanel` / `reorderPanels` / `refreshEmotes` (broadcaster)
- `stream` — `isLive` / `getStreamCredentials` / `getViewerToken` (public), `getBroadcasterToken` / `provision` / `goLive` / `stopLive` (broadcaster)
- `admin` — `listWebhooks` / `upsertWebhook` / `createInvite` / `listInvites` / `acceptInvite` / `revokeInvite` / `updateProfile`

### Server routes (apps/server)

- `/api/auth/*` — better-auth handler
- `/api/trpc/*` — all routers
- `/api/health` — `{ok:true}`
- `/api/webhooks/getstream` — HMAC-verified Video webhook receiver. Updates `channelConfig.liveStartedAt/EndedAt` + fans out Discord embeds.

Worker also has a 12h cron handler that pulls emotes from Twitch/7TV/BTTV/FFZ → `EMOTES_KV`.

---

## Recent commit history

```
be0eac2 docs: phase 5 sweep — progress, resume, need_to_do
79e481d phase 5.3-5.9: full broadcaster dashboard
4415105 phase 5.2: live → stream dashboard page (go live + rtmps + title)
9c75cc1 phase 5.0 v3: onboarding ui polish
09340aa chore: scrub remaining mrdemonwolf placeholders, keep mrdemonwolf inc. branding
0b2bc92 chore: drop /signup, allowSignups, and @mrdemonwolf hardcoding
8357c24 phase 5.0 v2: simpler single-form login
5e4e068 phase 5.0 v2: first-run setup creates account + broadcaster in one flow
aa9543a fix(web): dashboard layout reads via api, not direct db
4a00b59 phase 5.1: dashboard shell + broadcaster middleware
587797f phase 5.0a: twitch helix lib + setup tRPC router
75353d4 fix(web): chat css path moved in stream-chat-react v14
c0ae417 fix(ci): adopt existing cloudflare resources on first ci deploy
7472604 fix(ci): forward deploy-time env vars through turbo to alchemy
9e0809b chore(ci): bump oven-sh/setup-bun v2.1.3 -> v2.2.0
b07bdc5 fix(ci): pass alchemy + stream + twitch secrets to deploy step
a6208b0 fix(ci): use CloudflareStateStore for alchemy in CI
04ded53 refactor: read broadcasterTwitchId from db, drop the env var
40e7cd5 docs: phase 4 sweep — progress, resume, need_to_do
e3ead0a phase 4: custom emote rendering in chat
eda0a19 phase 4: emote pipeline (twitch/7tv/bttv/ffz -> kv, 12h cron)
7aa26bc phase 4: channel.createCall mutation seeds streamCallId + chatChannelCid
c151db0 chore: swap biome for eslint + prettier (matches fangdash setup)
6ab6911 phase 4: wire real getstream video player + chat dock (lazy-loaded)
485f40b docs: mark phase 3 (a-d) complete in progress + resume
7871c6c phase 3d: discord webhook fanout on go-live/end
580a995 phase 3c: channel page replaces / (single tenant)
909b27d phase 3b: getstream jwt signer + trpc procedures + webhook receiver
39939d1 phase 3a: channel schema (profiles, channelConfig, panels, invites, webhooks, userBans)
08ab359 refactor: extract DisplayHeading + auth-toast helpers (audit dedupe)
e71f85d phase 2: docs sweep (bun, mail.md, ci/cd notes, progress checkboxes)
0011e14 phase 2: github actions ci + deploy + license bump + LICENSE
a405891 phase 2: /account/security with 2fa + passkeys + session mgmt
2a50ddc phase 2: better auth plugins (username, twoFactor, magicLink, passkey)
81c65c7 phase 2: switch pnpm to bun, bump catalogs ...
35d45bb phase 2: mail package with resend/smtp/console transports + mailpit dev compose
05b1954 phase 1: wire server.url to web build for prod proxy
030ac02 phase 1: darker bg, token-based form colors, og meta, mrdw readme
efd4335 phase 1: navy/cyan theme, bricolage font, howlcast landing
9bb5acd phase 1: initial drizzle migration from auth schema
c3873fe phase 1: rename workers, add r2/kv/cron, same-origin api proxy
206077b docs: drop r2 emote proxy, twitch id as single setup input, free plan ok
a39c4a3 scaffold from better-t-stack 3.27
49a56f5 docs: pre-scaffold snapshot
```

---

## What's next — Phase 6 (Polish & Launch)

Roughly in priority order:

1. **Live → Stats page** — broadcaster analytics. 7-day rolling viewer count + minutes streamed. Source: GetStream call recordings or Cloudflare Worker analytics + a small `stream_sessions` table we'd add.
2. **Viewer `/account` page** — display name, pronouns, avatar; sessions list (mirrors broadcaster /account but for viewers).
3. **Streamer Mode toggle** in dashboard header — masks the stream key + redacts notification text in case the broadcaster screen-shares.
4. **White-label settings** — `whiteLabel` table (logo, name, footer attribution); rendered site-wide. Reference `docs/branding-spec.md`.
5. **PP / TOS WYSIWYG** + `/privacy` + `/terms` routes — Tiptap editor, rehype-sanitize. Single-row `legalDocs` table.
6. **Error boundaries** on every page + 404 page + loading skeletons.
7. **OG images** via `@vercel/og`.
8. **Cloudflare Web Analytics** snippet.
9. **Hard live OBS test** — real RTMPS push, verify webhook fires, Discord fanout fires, channel page goes live.
10. **Operations runbook** — deploy/rollback steps in `docs/`.

After Phase 6: **Phase 7** is the Astro Starlight docs site at `docs.howlcast.tv`.

---

## Open user actions (NEED_TO_DO.md authoritative)

These are things only Nathanial can do (account creation, paid setup, etc.):

1. ✅ **Push to GitHub** — done (up through `be0eac2`)
2. ✅ **GH Actions secrets** — all 10 set (Cloudflare, Alchemy, Better-Auth, Stream, Twitch)
3. ✅ **GetStream account + keys** — done; webhook configured at Video & Audio dashboard
4. ✅ **Twitch dev app** — `TWITCH_CLIENT_ID` + `TWITCH_CLIENT_SECRET` set
5. **Decide testing path** — local dev (recommended) vs. wipe prod D1 to re-run `/setup`. User has an existing prod account from earlier wizard test; can't re-run setup against prod without wiping.
6. **Configure Discord webhooks** — once user goes through Dashboard → Notifications and pastes URLs (no env work needed, all UI now)
7. **Resend domain verify** — for real prod email delivery (currently falls through to console). Eventually.
8. **Buy `howlcast.tv` domain** — unlocks custom-domain attach (Phase 1.21–1.23 deferred items).

---

## How to pick this back up after `/compact`

Paste this single prompt to a fresh Claude Code session in the repo:

```
Read RESUME.md, PROGRESS.md, NEED_TO_DO.md, and CLAUDE.md.
Tell me where we left off, what the next concrete action is, and run a
`git status` + `git log --oneline -10` to verify state matches RESUME.md.
```

That's it. RESUME.md → PROGRESS.md → next action.

---

## Original kickoff prompt (for cold-start sessions starting fresh)

> Read these files in order, then summarize what you understand and tell me the next concrete action:
>
> 1. CLAUDE.md
> 2. DESIGN-DECISIONS.md
> 3. docs/architecture.md
> 4. docs/build-plan.md (Phase 6 — polish & launch)
> 5. PROGRESS.md
> 6. docs/branding-spec.md (Phase 6 white-label / legal docs spec)
> 7. RESUME.md (this file)
> 8. NEED_TO_DO.md
>
> Then list the design files in `design-handoff/project/` and tell me which file you'll reference for which build phase.
>
> Wait for me to confirm before starting code work.
