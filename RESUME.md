# RESUME — current session state

> **Purpose:** if context gets compacted or a fresh Claude session picks up here, this single file gets you back to speed in under two minutes. PROGRESS.md tracks the build plan; this tracks the **conversation state** — what's mid-flight, what just shipped, what's next.

---

## Where we are

**Phase 4 — Chat & Emotes.** Fully shipped: real GetStream Video player + Chat dock are wired (lazy-loaded), `channel.createCall` mutation provisions the call+channel, 12h cron pulls emotes from Twitch/7TV/BTTV/FFZ → KV, custom emote rendering hooks into stream-chat-react. Phase 5 (broadcaster dashboard) is next. Lint stack swapped: biome → eslint+prettier (matches fangdash).

**Live URLs:**

- Web: <https://howlcast.mrdemonwolf.workers.dev>
- API: <https://howlcast-api.mrdemonwolf.workers.dev>
- Both `/api/health` return `{"ok":true}`.

**Repo:** <https://github.com/MrDemonWolf/howlcast> — public, default branch `main`. Not pushed since the start (per user's standing instruction). Local commits ahead.

---

## Stack quick reference

- **Package manager:** **bun 1.3+**. Catalog in `package.json` `workspaces.catalog`. Run `bun install`, `bun run dev`, `bun run deploy` (NOT `bun deploy` — collides with bun's built-in).
- **Monorepo:** Turborepo. `apps/web` (Next.js 16 OpenNext), `apps/server` (Hono), `packages/{api,auth,db,env,infra,mail,ui,config}`.
- **Auth:** Better Auth 1.6.9 + plugins (`username`, `twoFactor`, `passkey` via `@better-auth/passkey`, `magicLink`).
- **Mail:** `@howlcast/mail` — Resend → SMTP/mailpit → console fallback.
- **DB:** Cloudflare D1 (`howlcast-db`). Drizzle ORM. Migrations in `packages/db/src/migrations/`. Latest migration: `0002_supreme_master_chief.sql`.
- **Infra:** Alchemy 0.93. Resources declared in `packages/infra/alchemy.run.ts`. State stored in CF KV per stage.
- **CI/CD:** `.github/workflows/{ci,deploy,update-license-year}.yml`. Bun-based, `oven-sh/setup-bun@v2.1.3`. Deploy chains via `workflow_run` after CI green on main. **Secrets not yet set in GH** — `NEED_TO_DO.md` step 2.
- **Brand:** navy `#091533` + cyan `#0FACED` + Bricolage Grotesque + Geist. Dark only. Wolf-themed but understated. `assets/logos/howlcast-*.svg` are the brand assets.

---

## Critical decisions (don't relitigate)

- **Single broadcaster, single-tenant.** No `/[username]` route. **The channel page IS the home page (`/`).** Locked May 2026.
- **Two roles only:** broadcaster + viewer. One `is_invited` boolean replaces all tier/sub logic. No mods role (broadcaster moderates via GetStream's built-in tools).
- **Den layout only.** No theater, no editorial.
- **Two Discord webhooks** (public + private), DB-stored, edited from Dashboard → Channel → Notifications. **No other notification channels** (no email-on-live, RSS, web push).
- **Single email template:** "Private stream invite". No sub thank-you, raid alert, etc.
- **No R2 emote proxy.** Emote images load direct from provider CDNs (browser-cached). Only metadata is in KV.
- **Twitch ID = single setup input** (Phase 6 wizard). Seeds display name, bio, avatar, broadcaster Twitch ID. Pulls emotes from all 4 providers (Twitch, 7TV, BTTV, FFZ) using that one ID.
- **Cross-subdomain cookies are blocked on `*.workers.dev`** (Public Suffix List). Same-origin proxy via Next.js rewrites is the workaround. `apps/web/next.config.ts` rewrites `/api/*` to `${NEXT_PUBLIC_SERVER_URL}/api/*`. In prod (`howlcast.tv` + `api.howlcast.tv`), enable `crossSubDomainCookies` for actual cross-origin sessions.

---

## Recent commit history

```
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

## What's left in Phase 3 (next session pick-up here)

### Stage 3B — GetStream JWT signer + tRPC procedures (in progress)

**Reference doc:** `docs/integrations/getstream.md` already contains the WebCrypto JWT signing pattern verbatim. Use it.

Files to create/touch:

- `packages/api/src/lib/stream.ts` — `signStreamUserToken()`, `signAdminToken()`, REST helpers for create-call / go-live / stop-live.
- `packages/api/src/routers/stream.ts` — tRPC procedures: `getViewerToken`, `getBroadcasterToken`, `getStreamCredentials`, `isLive`.
- `apps/server/src/index.ts` — mount `/api/webhooks/getstream` route with HMAC verification.
- `apps/server/.env` — add `STREAM_API_KEY`, `STREAM_API_SECRET`, `STREAM_WEBHOOK_SECRET` (placeholders; user supplies real values from PRE-FLIGHT step 3).
- `packages/infra/alchemy.run.ts` — bind the three Stream env vars to the server worker (use `process.env` fallback to empty string, same pattern as RESEND_API_KEY).

**Constraints:**

- Workers-compatible only. Sign with WebCrypto, no `@stream-io/node-sdk`.
- The same JWT works for both Video and Chat — sign once, init both clients.
- Webhook secret is a separate value (`STREAM_WEBHOOK_SECRET`), set on the GetStream dashboard webhook config + matching env var here.

**Skip until user supplies keys:** actual go-live testing, OBS push. Code lands fine without keys; tRPC procedures throw a clear "Stream not configured" error if `STREAM_API_KEY` is empty.

### Stage 3C — Channel page replacing `/`

**Reference design:** `design-handoff/project/HowlCast.html` — match visually.

User clarified: **single tenant, channel page = home page**. Migrate `apps/web/src/app/page.tsx` from the current "Sign in / Dashboard" landing into the actual channel layout:

- Player on top of left column (GetStream Video player wrapper component)
- Streamer info row directly below (avatar, name, verified, title)
- Panels grid (3 col → 2 col → 1 col responsive)
- Chat dock right (340–360px), pop-out button in chat header — Phase 4 wires the actual chat
- Public mode: chat read-only, input replaced with "Chat is invite-only · DM mrdemonwolf to join the den" CTA card
- Private mode: gated behind `isInvited` check
- Mobile: collapses to single column, chat moves below panels

LIVE badge + viewer count overlay drive off `isLive` tRPC query polling every ~10s (or use webhook-driven invalidation later).

### Stage 3D — Discord webhooks fire on go-live/end

GetStream sends `call.live_started` / `call.live_ended` events to `/api/webhooks/getstream`. Verify HMAC with `STREAM_WEBHOOK_SECRET`. On match:

- Update `channel_config.liveStartedAt` / `liveEndedAt`.
- Read the configured `webhooks` rows (public, private). For each enabled one, POST a Discord embed (title, broadcaster name + avatar, link to channel page, "LIVE NOW" / "Stream ended").
- Respect `notifyOnLive` / `notifyOnEnd` toggles per row.

---

## Open user actions (NEED_TO_DO.md authoritative)

1. **Push to GitHub** — `git push origin main`. Triggers CI.
2. **GH Actions secrets** — `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ALCHEMY_PASSWORD`, `BETTER_AUTH_SECRET`. Optional `RESEND_API_KEY` later.
3. **Phase 3 keys** (when Stage 3B starts to need them): GetStream `STREAM_API_KEY`/`STREAM_API_SECRET`, Discord webhook URLs (paste into DB via dashboard once Phase 5 ships), Twitch `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET`/`BROADCASTER_TWITCH_ID`.
4. **Domain** — `howlcast.tv` purchase whenever you're ready, unblocks Phase 1.21–1.23 custom domain attach.

---

## How to pick this back up after `/compact`

Open Claude Code in the repo and paste:

```
Read RESUME.md, PROGRESS.md, NEED_TO_DO.md, and CLAUDE.md.
Tell me where we left off, what the next concrete action is, and run a `git status` + `git log --oneline -10` to verify state matches RESUME.md.
```

That's it. RESUME.md → PROGRESS.md → next action.

---

## Original kickoff prompt (for cold-start sessions)

> Read these files in order, then summarize what you understand and tell me the next concrete action:
>
> 1. CLAUDE.md
> 2. DESIGN-DECISIONS.md
> 3. docs/architecture.md
> 4. docs/build-plan.md (Phase 3 — channel & streaming)
> 5. PROGRESS.md
> 6. docs/branding-spec.md (Phase 5 spec — read for full context)
> 7. RESUME.md (this file)
> 8. NEED_TO_DO.md
>
> Then list the design files in `design-handoff/project/` and tell me which file you'll reference for which build phase.
>
> Wait for me to confirm before starting code work.
