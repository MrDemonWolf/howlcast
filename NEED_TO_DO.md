# NEED TO DO — manual actions, in order

> Stuff Claude can't do for you. Listed in the order you should do them — top to bottom.
> Each item is independent enough to knock out in 5–15 min.

---

## RIGHT NOW (unblocks everything)

### 1. Push to GitHub

Per your standing instruction, Claude won't push until you say so. When ready:

```bash
git push origin main
```

Triggers CI immediately. Deploy will run too but fail at "Deploy via Alchemy" without the secrets in step 2 — that's fine, CI itself will go green.

---

### 2. Set GitHub Actions secrets (unlocks CI/CD)

Repo: <https://github.com/MrDemonWolf/howlcast/settings/secrets/actions>

Click **New repository secret** for each:

| #   | Name                    | Value                              | Where to get it                                                                                                                                                                                                                                                                                                |
| --- | ----------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | `CLOUDFLARE_API_TOKEN`  | (paste)                            | <https://dash.cloudflare.com/profile/api-tokens> → Create Token → **Custom token**. Permissions: **Account → Workers Scripts: Edit**, **Account → D1: Edit**, **Account → R2: Edit**, **Account → Workers KV Storage: Edit**, **User → User Details: Read**. Account resources: **Include → MrDemonWolf Inc.** |
| 2.2 | `CLOUDFLARE_ACCOUNT_ID` | `b44e8f4116067556c6a165c1dcc74f42` | already known                                                                                                                                                                                                                                                                                                  |
| 2.3 | `ALCHEMY_PASSWORD`      | (paste from `packages/infra/.env`) | run `cat packages/infra/.env` and copy the value                                                                                                                                                                                                                                                               |
| 2.4 | `BETTER_AUTH_SECRET`    | (paste from `apps/server/.env`)    | run `cat apps/server/.env` and copy the value                                                                                                                                                                                                                                                                  |

After 2.1–2.4 land, push another commit (or rerun the failed Deploy from the Actions tab) and watch CI → Deploy go green end-to-end.

---

### 3. Optional: GitHub Environment for prod

For an extra "review before deploy" gate:

1. Repo Settings → **Environments** → **New environment** → name it `production`
2. Optionally add yourself as a **required reviewer** so each prod deploy needs one click

`deploy.yml` already references `environment: production` — adding required reviewers is the only manual step.

Skip this until you actually want approval gates.

---

## DURING PHASE 3 (streaming)

You'll need these the moment we wire GetStream + Discord webhooks. Do them when you see Claude start Phase 3:

### 4. GetStream account + API keys

Follow PRE-FLIGHT.md step 3. Save in 1Password:

- `STREAM_API_KEY`
- `STREAM_API_SECRET`

Then drop them into `apps/server/.env` and add them as GH Actions secrets too (`STREAM_API_KEY`, `STREAM_API_SECRET`).

### 5. Discord webhooks

PRE-FLIGHT.md step 7. Make two channels in your Discord server, create a webhook for each. **Don't put these in env vars** — they go in the broadcaster dashboard later (Phase 5 Notifications page) and persist in the `webhooks` D1 table. For Phase 3 testing, paste them temporarily in DB via the dashboard once it ships.

### 6. Twitch developer app

PRE-FLIGHT.md step 5. Save:

- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
- `BROADCASTER_TWITCH_ID` (your numeric Twitch user ID)

Drop into `apps/server/.env` + GH Actions secrets. Phase 4 (emote pipeline) needs these.

### 7. 7TV / BTTV / FFZ verification

PRE-FLIGHT.md step 6. No signups — just curl-test that your Twitch ID returns emotes from each provider. If empty, you don't have channel emotes there yet (fine).

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
