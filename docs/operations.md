# Operations runbook

> **Audience:** future-Nathanial at 2 AM with a broken prod. Or a teammate who's never touched the stack.
>
> Every section assumes you're at the repo root with `bun` installed and `wrangler` already authed (`bunx wrangler login` once).

---

## Quick reference

| Need to…                                  | Run                                                |
| ----------------------------------------- | -------------------------------------------------- |
| Deploy a code change to prod              | `git push origin main` (CI auto-deploys)           |
| Manual deploy from local                  | `bun run deploy`                                   |
| Apply pending migrations to remote D1     | `bun run db:migrate:remote`                        |
| Apply pending migrations to local D1      | `bun run db:migrate:local`                         |
| List pending remote migrations            | `bun run db:migrations:list`                       |
| Run raw SQL against remote                | `bun run db:execute:remote --command 'SELECT ...'` |
| Run raw SQL against local                 | `bun run db:execute:local --command 'SELECT ...'`  |
| Generate a new migration from schema diff | `bun run db:generate`                              |
| Rebuild + deploy docs site                | Push any `apps/docs/**` change to main             |
| Tail prod logs                            | `bunx wrangler tail tv` or `tv-api`                |

---

## Deploy

### Normal deploy (recommended)

Push to `main`. `.github/workflows/ci.yml` runs check-types + lint + format. On green, `.github/workflows/deploy.yml` chains via `workflow_run` and runs `bun run deploy` (Alchemy → Cloudflare). Smoke-tests `/api/health` after.

Concurrency group is `deploy` — two pushes don't race; the latter waits.

### Manual deploy from local

```bash
bun run deploy
```

Reads alchemy state, makes converging Cloudflare API calls. Prints worker URLs at the end. Use this if CI is broken or you need to test something a CI run can't reproduce.

### Deploy only the docs site

`.github/workflows/deploy-docs.yml` triggers on `apps/docs/**` or migration file changes. Pushes the static export to GitHub Pages. Independent of the main deploy.

To force a docs rebuild without a content change: edit + push `.github/workflows/deploy-docs.yml` (any change works).

### What gets deployed

`bun run deploy` → Alchemy converges:

1. Both Workers (`tv` + `tv-api`) — code from `.open-next/` and the api source
2. Custom domains (`tv.mrdemonwolf.com` + `api.tv.mrdemonwolf.com`) attach if not already
3. Secrets uploaded if changed (idempotent — empty diff = no-op)
4. D1 / R2 / KV bindings reattach to current resources

D1 schema is **not** migrated by deploy. Run migrations separately.

---

## Rollback

### Revert a code change

```bash
git revert <commit-sha>
git push origin main
```

CI deploys the revert. ~2 min downtime window for the offending feature.

### Rollback a Worker without reverting source

`bunx wrangler rollback` against the offending Worker. Need to know the version ID:

```bash
bunx wrangler deployments list --name tv
bunx wrangler rollback --name tv <version-id>
```

This bypasses Alchemy state. Re-deploying via `bun run deploy` will overwrite. Use only as an emergency hold.

### Rollback a D1 migration

D1 has no built-in down migrations. Drizzle doesn't generate them. Options:

1. **Write a manual reversal SQL file** (`0XXX_revert_thing.sql`), apply via `bun run db:migrate:remote`. Cleanest.
2. **Restore from D1 time-travel backup** ([Cloudflare D1 docs](https://developers.cloudflare.com/d1/reference/time-travel/)) — restores full DB to a point-in-time within ~30 days. Destructive.

Always test reversal SQL on `--local` first.

---

## Database

### Inspect remote state

```bash
bun run db:migrations:list
# pending migrations

bun run db:execute:remote --command 'SELECT name FROM sqlite_master WHERE type="table"'
# all tables

bun run db:execute:remote --command 'SELECT * FROM channel_config'
# single-row site state
```

### Schema changes

1. Edit `packages/db/src/schema/`
2. `bun run db:generate` (or write SQL by hand mirroring `0009_stream_analytics.sql` if drizzle-kit needs interactive prompts)
3. Append entry to `packages/db/src/migrations/meta/_journal.json`
4. `bun run db:migrate:local` — test
5. Commit, PR, merge
6. `bun run db:migrate:remote` after merge

### Reset local D1

```bash
rm -rf .wrangler/state/v3/d1
bun run db:migrate:local
```

Wipes all local data, re-runs all migrations from scratch.

### Reset remote D1 (DESTRUCTIVE)

Only in test/dev. Never in prod with real users.

```bash
# from apps/web/
bunx wrangler d1 execute howlcast-db --remote --command 'DELETE FROM user'
bunx wrangler d1 execute howlcast-db --remote --command 'UPDATE channel_config SET setup_completed_at = NULL WHERE id = "site"'
```

Re-run `/setup` to recreate the broadcaster.

---

## Secret rotation

### Better Auth secret

Invalidates **all** user sessions. Plan downtime.

1. Generate new value: `openssl rand -hex 32`
2. Update `apps/server/.env` locally + GitHub Actions secret
3. `bun run deploy`
4. Notify users they'll be signed out

### GetStream API secret

Webhook downtime ~1 minute during rotation.

1. Rotate in GetStream dashboard → copy new secret
2. Update `apps/server/.env` + GH Actions secret
3. `bun run deploy`
4. Test: trigger a fake webhook → 401 means new secret didn't propagate, retry

### Resend API key

1. Generate new key in Resend dashboard
2. Update `RESEND_API_KEY` env + GH secret
3. `bun run deploy`
4. Revoke old key in Resend dashboard
5. Send a test invite to confirm

### Twitch client secret

1. Twitch dev console → app → New Secret
2. Update `TWITCH_CLIENT_SECRET` env + GH secret
3. `bun run deploy`
4. The Twitch app token cache (`twitch:apptoken` in KV) may have a stale token for ≤50 min. Force expire: `bunx wrangler kv key delete --binding=EMOTES_KV "twitch:apptoken"` (from `apps/server/`)

---

## Logs + debugging

### Tail Worker logs

```bash
# from apps/web/ (web)
bunx wrangler tail

# from apps/server/ (api)
bunx wrangler tail
```

Live stream of every request + console.log + uncaught error. Ctrl-C to stop.

Add filters: `bunx wrangler tail --status error` (errors only), `--method POST` (writes only), `--search "stream.goLive"` (specific tRPC call).

### Inspect KV

```bash
# from apps/server/
bunx wrangler kv key list --binding=EMOTES_KV
bunx wrangler kv key get --binding=EMOTES_KV "emotes:current"
bunx wrangler kv key get --binding=EMOTES_KV "analytics:current_session_id"
```

Useful for analytics debugging — confirm the current session ID + viewer count are what you expect during a live stream.

### Inspect R2

```bash
# from apps/web/
bunx wrangler r2 object list howlcast-public
bunx wrangler r2 object get howlcast-public branding/logo-<hash>.png > /tmp/logo.png
```

Branding logos are content-addressed — no orphan cleanup needed (re-uploading the same bytes is a no-op).

### Cron debug

Two crons run on `tv-api`:

- `0 */12 * * *` — emote refresh
- `* * * * *` — analytics sampler + 7d prune

To trigger manually: `bunx wrangler triggers deploy` doesn't help here. Easier: tail logs while waiting for the next firing, OR temporarily wire a hidden `/api/_cron/*` endpoint that calls the same code paths. Don't ship the test endpoint to prod.

---

## GetStream

### Re-provision the call

If `streamCallId` is stale (e.g. you deleted the call in GetStream dashboard):

1. Dashboard → Stream → **Set up your stream** button
2. Server runs `stream.provision` → creates new call, persists ID
3. RTMPS URL + key refresh

### Webhook URL change

If you migrated workers (e.g. `howlcast-api` → `tv-api`):

1. GetStream dashboard → Video → Webhook URL → update to current api worker URL
2. GetStream dashboard → Chat → Webhook URL → same
3. Confirm subscriptions for: `call.live_started`, `call.session_started`, `call.session_ended`, `call.ended`, `call.session_participant_joined`, `call.session_participant_left`, `message.new` (Chat)

### Stuck "Going live..." in dashboard

Most common cause: webhook URL points at wrong worker. See [Webhook URL change](#webhook-url-change).

If URL is correct: GetStream may have rate-limited webhook delivery. Wait 60s; usually resolves. If not, force-end via the dashboard escape hatch, then re-provision.

---

## Branding logo

### Replace the logo

Dashboard → Branding → Logo upload. PNG, SVG, or JPEG. Max 1 MB. Bytes hashed for the R2 key — uploading the same file is idempotent.

Reset to default reverts `customLogoKey` to NULL; the `BrandMark` SVG renders.

### Manual R2 inspect

```bash
# from apps/web/
bunx wrangler r2 object list howlcast-public --prefix branding/
```

Old logos accumulate (each upload is a new hash key). Hand-prune if storage matters; bucket free tier covers thousands.

---

## Streaming health check

After any infra change, verify the full live path works:

```bash
# 1. API health
curl https://tv-api.mrdemonwolf.workers.dev/api/health
# {"ok":true}

# 2. tRPC reachable
curl https://tv-api.mrdemonwolf.workers.dev/api/trpc/channel.getInfo
# {"result": ...}

# 3. Web → API rewrite works (cookies)
curl https://tv.mrdemonwolf.com/api/trpc/channel.getInfo
# {"result": ...}

# 4. Channel page renders
curl -I https://tv.mrdemonwolf.com
# 200 OK
```

Then: provision call → push from OBS → click Go Live → confirm:

- [ ] LIVE badge flips on channel page within 10s
- [ ] Discord embed posts in both channels
- [ ] `stream_sessions` row opens in D1
- [ ] After end: `endedAt` + `total_minutes` populated, peak viewers + chat count non-zero (if anyone joined / chatted)

---

## Things that have actually broken

(Add as we hit them. Each entry: symptom → cause → fix.)

### `ERR_TOO_MANY_REDIRECTS` after setup

- **Symptom:** Wizard finishes, then redirect loop
- **Cause:** Cookies can't cross between `*.workers.dev` subdomains (PSL)
- **Fix:** Attach custom domain (`tv.your-domain.tv`) or use same-origin proxy in dev

### "Going live..." stuck

- **Symptom:** Dashboard hangs at "Going live..."
- **Cause:** GetStream webhook URL pointing at retired worker
- **Fix:** Update GetStream dashboard webhook URL to current `tv-api.<account>.workers.dev`

### Stats page shows zero peak viewers

- **Symptom:** Sessions exist but `peakViewers = 0`
- **Cause:** Migration 0009 not applied, OR webhook missing `call.session_participant_joined` subscription
- **Fix:** `bun run db:migrations:list` → if 0009 pending, `bun run db:migrate:remote`. Then check GetStream subscriptions.

---

## Escalation paths

- **Cloudflare outage** — [cloudflarestatus.com](https://www.cloudflarestatus.com). Workers are usually the most resilient surface; D1 + R2 less so. No dependency we can swap out fast.
- **GetStream outage** — [status.getstream.io](https://status.getstream.io). Channel page degrades gracefully (offline banner). Chat won't work. No live possible.
- **Resend outage** — [status.resend.com](https://status.resend.com). Magic-link emails fail. Existing sessions unaffected.
- **D1 corruption** — Cloudflare time-travel backup ([docs](https://developers.cloudflare.com/d1/reference/time-travel/)). 30-day retention.

If the API worker itself is down, the web worker fails open with cached static assets but every tRPC call errors. The fix is always: re-deploy.
