# NEED TO DO — manual actions, in order

> Stuff Claude can't do for you. Listed in the order you should do them — top to bottom.
> Each item is independent enough to knock out in 5–15 min.

---

## RIGHT NOW (unblocks live deploy)

### 1. Push to GitHub

```bash
git push origin main
```

All 6 GH Actions secrets are in place. Push triggers CI → Deploy via Alchemy. The live URLs (<https://howlcast.mrdemonwolf.workers.dev>, <https://howlcast-api.mrdemonwolf.workers.dev>) get the new code + STREAM\_\* env vars and the `/api/webhooks/getstream` route comes online.

### 2. ✅ GitHub Actions secrets — DONE

`ALCHEMY_PASSWORD`, `BETTER_AUTH_SECRET`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `STREAM_API_KEY`, `STREAM_API_SECRET` all set. (No `STREAM_WEBHOOK_SECRET` — GetStream signs Video webhooks with the API Secret directly.)

---

### 3. Optional: GitHub Environment for prod

For an extra "review before deploy" gate:

1. Repo Settings → **Environments** → **New environment** → name it `production`
2. Optionally add yourself as a **required reviewer** so each prod deploy needs one click

`deploy.yml` already references `environment: production` — adding required reviewers is the only manual step.

Skip this until you actually want approval gates.

---

## STREAMING / EMOTES (Phase 3 + 4 wiring)

### 3. ✅ GetStream account + API keys — DONE

`STREAM_API_KEY` + `STREAM_API_SECRET` pasted into `apps/server/.env` and GH Actions secrets. App created (US East, Development environment).

### 4. GetStream Video webhook

GetStream Dashboard → HowlCast app → **Video & Audio → Overview → Webhook & Event Configuration**:

- URL: `https://howlcast-api.mrdemonwolf.workers.dev/api/webhooks/getstream`
- Check "Subscribe to all current and future events" (handler filters server-side)
- Submit

No separate webhook secret — GetStream signs Video webhooks with the app's API Secret (already configured).

### 5. Discord webhooks (deferred to Phase 5 dashboard)

Create two webhooks in your Discord server (one for the public alerts channel, one for the private den channel). Save the URLs in 1Password. **Don't put them in env vars** — Phase 5's Dashboard → Channel → Notifications page writes them into the `webhooks` D1 table. Skip until that page ships.

### 6. Twitch developer app

For the emote pipeline (Phase 4) — pulls Twitch channel emotes + acts as the broadcaster id key for 7TV / BTTV / FFZ:

1. <https://dev.twitch.tv/console/apps> → Register Your Application
2. OAuth Redirect URLs: `http://localhost` (we don't use the user-OAuth flow)
3. Category: Application Integration
4. Save `Client ID` + new `Client Secret`
5. Get your numeric Twitch user ID: <https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/>
6. Drop into `apps/server/.env`:
   ```
   TWITCH_CLIENT_ID=...
   TWITCH_CLIENT_SECRET=...
   BROADCASTER_TWITCH_ID=...
   ```
7. Add the same three to GitHub Actions secrets

Until you do this, the emote pipeline returns an empty list — chat works, just no custom emotes.

### 7. 7TV / BTTV / FFZ verification (no signup)

Once `BROADCASTER_TWITCH_ID` is set, curl-test each provider. Empty responses are fine (you just don't have emotes there).

---

## DURING PHASE 4-5 (chat + dashboard)

### 8. Resend domain verify

PRE-FLIGHT.md step 4. ~15 minutes of DNS work + waiting. Save `RESEND_API_KEY`. Drop in `apps/server/.env` + GH Actions secrets. Until this ships, magic-link emails go through mailpit (`bun run dev:mail`) or console.

### 9. Buy `howlcast.tv` domain

PRE-FLIGHT.md step 2. Through Cloudflare Registrar (~$30/yr). Once you own it, Claude can wire the custom domain bindings (Phase 1.21–1.23 deferred items) and `crossSubDomainCookies` in Better Auth.

---

## CI / CD — how it works (reference)

Three workflows in `.github/workflows/`:

**`ci.yml`** — runs on every push and PR to `main`.

1. Setup Bun (pinned to `package.json` `packageManager`)
2. Cache `~/.bun/install/cache` keyed on `bun.lock`
3. `bun install --frozen-lockfile`
4. `bun run check-types`
5. `bun x biome check .`

**`deploy.yml`** — runs after `ci.yml` succeeds on `main`.

- Triggered by `workflow_run` on `CI` workflow with conclusion `success` on `main`
- Or manually via `workflow_dispatch` (Actions tab)
- Runs `bun run deploy` (Alchemy)
- Smoke-tests `/api/health` on both worker URLs

**`update-license-year.yml`** — annual cron Jan 1st 06:00 UTC. Opens a PR updating the year in `LICENSE`.

Concurrency group is `deploy` so two pushes don't race.

---

## First-run setup page (Phase 6 — not built yet)

Heads up: when you visit `/dashboard` today it's the BTS placeholder. Phase 6 builds `/setup`:

1. Detect `channelConfig.setupCompletedAt IS NULL` → force redirect from `/` to `/setup`
2. Single input: **broadcaster Twitch user ID**
3. Server fetches Twitch Helix for display name, bio, avatar URL
4. Downloads avatar to R2 `howlcast-public`, stores key
5. Pre-warms emote KV cache from all 4 providers
6. Marks `setupCompletedAt = now()`, redirects to `/dashboard`

Why this works: every emote provider keys off Twitch user ID. One field unlocks everything.

---

## PRE-FLIGHT items still open (reference)

Most of `PRE-FLIGHT.md` is unchecked. The deferred ones that block later phases:

- [ ] Step 2 — buy `howlcast.tv` (blocks custom domain attach: Phase 1.21–1.23)
- [ ] Step 3 — GetStream account + API keys (blocks Phase 3 streaming)
- [ ] Step 4 — Resend domain verify + API key (blocks prod magic-link emails)
- [ ] Step 5 — Twitch dev app (blocks Phase 4 emote pipeline)
- [ ] Step 6 — note 7TV / BTTV / FFZ IDs
- [ ] Step 7 — Discord webhooks
- [x] Step 8a — repo exists at MrDemonWolf/howlcast
