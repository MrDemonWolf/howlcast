# RESUME — current session state

> **Purpose:** if context gets compacted or a fresh Claude session picks up here, this single file gets you back to speed in under two minutes. PROGRESS.md tracks the build plan; this tracks the **conversation state** — what's mid-flight, what just shipped, what's next.

---

## Where we are

**Phase 6 layout/Card refactor shipped. Only OBS hard test + Web Analytics + cross-browser sweep + ops runbook left for Phase 6.** Then Phase 7 (docs site).

All Phase 5 surface holds (9 dashboard pages, setup wizard, invite-only auth, two-domain workers + custom DNS). Phase 6 polish is now ~80% done — Stats, Streamer Mode, viewer `/account`, white-label, Tiptap legal, error boundaries, 404, loading skeletons, OG images, robots/sitemap all shipped earlier in the phase. Recent work concentrated on internal consolidation (audit findings, helper dedupe, brand-hex centralization, public-mode removal) and a structural UI refactor (layout token scale → shadcn primitives → layout shells → page migrations → Card sweep).

**Recent (latest commits, newest first):**

- _pending_ phase 6: own analytics — viewer + chat tracking via GetStream webhooks
- `6b49085` phase 6: card primitive sweep + dashboard inline-style cleanup
- `6c0b155` phase 6: route channel page through `ChannelLayout`
- `8645e46` refactor: serve branding logo via Next.js route + optimize through `<Image>`
- `7441061` feat: stream branding logos through `/api/branding/logo`, drop public-bucket env
- `b3f44ab` feat(infra): bind `NEXT_PUBLIC_PUBLIC_BUCKET_URL` on web worker
- `d1bc6d7` phase 6: route auth + viewer pages through `PageContainer`
- `335b3c4` phase 6: extract shared `LegalDocPage`, dedupe privacy + terms
- `d4c057c` phase 6: add layout shells (`PageContainer`, `ChannelLayout`, `ContentSection`)
- `c5bd186` phase 6: 11 shadcn primitives → `@howlcast/ui`
- `3ed92b6` phase 6: layout token scale → `globals.css`
- `dd5167c` feat: invite-only by design — drop public mode end-to-end
- `8620704` docs: pre-Phase-6 code audit report (`AUDIT.md`)
- `98c51c4` feat(env): `NEXT_PUBLIC_PUBLIC_BUCKET_URL` via env package
- `c34b1a7` refactor(api): dedupe shared helpers, single drizzle per request
- `9d42c56` feat(config): centralize brand hex tokens

**Live URLs:**

- Web: <https://tv.mrdemonwolf.com> (custom domain) + <https://tv.mrdemonwolf.workers.dev> (fallback)
- API: <https://api.tv.mrdemonwolf.com> (custom domain) + <https://tv-api.mrdemonwolf.workers.dev> (fallback)
- All `/api/health` return `{"ok":true}`. CI/Deploy via GH Actions, all secrets in place.

**Outstanding before Phase 6 ships:**

1. **Hard live OBS test** — push real RTMPS, verify webhook fires, Discord fanout fires, channel page flips to LIVE, Stats page records the session (incl. peak viewers + chat count + per-session line/bar charts). Only Nathanial can do.
2. **Cross-browser sweep** — Safari, Chrome, Firefox, iOS, Android. Looking for layout regressions in the new shells + Card surfaces + Stats charts.
3. **Operations runbook** (`docs/operations.md`) — deploy / rollback / D1 migrate / GetStream rotation.

**Replaced:** Cloudflare Web Analytics dropped — own analytics via GetStream webhooks shipped instead. Per-session detail page at `/dashboard/stats/[id]` with viewer-line + chat-msgs/min charts. 1-minute cron sampler keeps a baseline series + prunes snapshots > 7 days.

**Done since last RESUME refresh:**

- Migrations applied to remote D1 ✅
- `legal@mrdemonwolf.com` mailbox set up ✅
- GetStream Video webhook URL updated (Go Live no longer hangs) ✅

**Repo:** <https://github.com/MrDemonWolf/howlcast> — default branch `main`. Latest pushed: `6b49085`. Branch protection enabled.

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

For full history run `git log --oneline`. Highlights since Phase 5 wrap:

```
6b49085 phase 6: card primitive sweep + dashboard inline-style cleanup
6c0b155 phase 6: route channel page through ChannelLayout
8645e46 refactor: serve branding logo via next.js route + optimize <Image>
7441061 feat: stream branding logos through /api/branding/logo
b3f44ab feat(infra): bind NEXT_PUBLIC_PUBLIC_BUCKET_URL on web worker
d1bc6d7 phase 6: route auth + viewer pages through PageContainer
335b3c4 phase 6: extract shared LegalDocPage, dedupe privacy + terms
d4c057c phase 6: add layout shells (PageContainer, ChannelLayout, ContentSection)
c5bd186 phase 6: add 11 shadcn primitives to @howlcast/ui
3ed92b6 phase 6: add layout token scale to globals.css
dd5167c feat: invite-only by design — drop public mode end-to-end
8620704 docs: pre-Phase-6 code audit report (AUDIT.md)
98c51c4 feat(env): NEXT_PUBLIC_PUBLIC_BUCKET_URL via env package
c34b1a7 refactor(api): dedupe shared helpers, single drizzle per request
9d42c56 feat(config): centralize brand hex tokens
39196df refactor(db): drop unused user_bans table, index invites
02234fd fix(security): html-escape, rate-limit, webhook hardening
b44509f feat(api): add html-escape + kv throttle primitives
0383964 fix: lint pipeline + check-types coverage across all packages
1e415c0 fix(setup): client-side setup-completed redirect + private-gate height
258305d phase 6: getstream rewrite round 2
bb81a75 phase 6 polish: refresh UI to claude design v2 handoff
15277a1 phase 6 wrap: full ci test bundle + prod wipe + pro removal
341c4b1 phase 6: white-label + tiptap legal + viewer account + og images
ca20341 phase 6: stats page + streamer mode + error pages + privacy/terms
c1a9003 fix(stream): getstream frontend rewrite + webhook chat unblock
be0eac2 docs: phase 5 sweep — progress, resume, need_to_do
```

---

## What's next — finishing Phase 6 + Phase 7

**Phase 6 remaining:**

1. **Hard live OBS test** — real RTMPS push, verify webhook fires, Discord fanout fires, channel page goes live, Stats records the session (peak viewers, chat count, per-minute chat bars).
2. **Cross-browser sweep** — Safari, Chrome, Firefox, iOS, Android. Watch for regressions in the new shells + Card surfaces + Stats charts.
3. **Operations runbook** (`docs/operations.md`) — deploy / rollback / D1 migrate / GetStream rotation / Resend rotation.

**Already done in Phase 6** (don't relitigate): Stats + own analytics, Streamer Mode, viewer `/account`, white-label, Tiptap legal editor, error boundaries, 404, loading skeletons, OG images, robots+sitemap, code-audit pass, brand-hex centralization, API helper dedupe, public-mode removal, layout token scale, shadcn primitives, layout shells, page migrations, Card sweep, inline-style cleanup, branding logo via Next.js route.

After Phase 6: **Phase 7** is the Astro Starlight docs site at `docs.howlcast.tv`. See `docs/docs-site.md`.

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
