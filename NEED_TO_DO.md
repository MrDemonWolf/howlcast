# NEED TO DO — your turn

> Stuff Claude can't do for you. Each row = one action, one outcome.

---

## 🚀 RIGHT NOW (unblocks launch)

> Do 1 → 2 → 3 first. Then 4 (OBS test depends on them).

### 1. GetStream — Chat webhook

[dashboard.getstream.io](https://dashboard.getstream.io) → your app → **Chat** → Webhook URL.

- [ ] Set URL → `https://tv-api.mrdemonwolf.workers.dev/api/webhooks/getstream`
- [ ] Subscribe to `message.new`
- [ ] Save

Without this, the chat-message counter on Stats stays at 0.

### 2. GetStream — Video participant events

Same dashboard → **Video & Audio** → Webhook URL (same URL as above).

- [ ] Confirm `call.live_started` (or `call.session_started`) subscribed
- [ ] Confirm `call.session_ended` / `call.ended` subscribed
- [ ] **Add** `call.session_participant_joined`
- [ ] **Add** `call.session_participant_left`

Without the participant events, peak viewers + the line chart on the per-session detail page stay at 0.

### 3. Delete orphan workers

[dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages.

- [ ] Delete worker `howlcast` (left over from rename to `tv`)
- [ ] Delete worker `howlcast-api` (left over from rename to `tv-api`)

Or via CLI:

```bash
bunx wrangler delete howlcast
bunx wrangler delete howlcast-api
```

### 4. Hard live OBS test (end-to-end)

After 1–3 are done. Health check section in [`docs/operations.md`](docs/operations.md).

- [ ] Dashboard → **Set up your stream** (one click)
- [ ] Copy RTMPS URL + stream key into OBS → Settings → Stream → Service: **Custom**
- [ ] Click **Start Streaming** in OBS
- [ ] Click **Go live** in dashboard
- [ ] Verify LIVE badge flips on `tv.mrdemonwolf.com` within ~10s
- [ ] Verify Discord webhooks fire (public + private)
- [ ] Verify chat works for broadcaster + anonymous viewer
- [ ] After **End** → Dashboard → **Stats** shows non-zero peak viewers + chat count
- [ ] Click into session row → `/dashboard/stats/[id]` renders viewer line chart + chat-msgs/min bars

---

## 🟡 WHENEVER (does not block launch)

### Resend domain verify

Magic-link emails fall back to mailpit / console without this.

- [ ] [resend.com/domains](https://resend.com/domains) → Add domain → set the SPF / DKIM / DMARC records
- [ ] Wait ~15 min for verification
- [ ] Push API key as `RESEND_API_KEY` (locally + GH Actions)

### 7TV signup

Get more channel emotes flowing.

- [ ] [7tv.app](https://7tv.app) → sign in with Twitch
- [ ] Profile → Emotes → upload PNGs
- [ ] Pipeline picks them up on next 12h cron, or **Refresh** in dashboard

### FFZ emotes

- [ ] [frankerfacez.com](https://www.frankerfacez.com/) → sign in with Twitch
- [ ] Submit a New Emote → upload PNG → wait for moderator approval (1–7 days)

### Custom domain for docs

Currently at `mrdemonwolf.github.io/howlcast/`. To point `docs.howlcast.tv`:

- [ ] Add a `CNAME` file to `apps/docs/public/` containing `docs.howlcast.tv`
- [ ] Cloudflare DNS → CNAME `docs` → `mrdemonwolf.github.io`
- [ ] GitHub repo → Settings → Pages → Custom domain → `docs.howlcast.tv`

---

## 🟢 LATER (configure from dashboard)

| What                 | Where                                |
| -------------------- | ------------------------------------ |
| Discord webhooks     | Dashboard → **Notifications**        |
| Send invite emails   | Dashboard → **Invites**              |
| Add panels           | Dashboard → **Panels**               |
| Edit bio / pronouns  | Dashboard → **Account**              |
| Privacy + Terms text | Dashboard → **Branding** → Legal tab |
| Logo + platform name | Dashboard → **Branding**             |
| Pop out chat for OBS | Dashboard → **Chat** → Pop out       |

---

## CI/CD — reference

Workflows in `.github/workflows/`:

- **`ci.yml`** — every push + PR. Type-check + lint + format.
- **`deploy.yml`** — after CI green on main. Alchemy → Cloudflare. Smoke-tests `/api/health`.
- **`deploy-docs.yml`** — on `apps/docs/**` change. Builds + deploys to GitHub Pages.
- **`update-license-year.yml`** — annual cron Jan 1.

Concurrency: `deploy` and `deploy-docs` each have their own group; pushes don't race.
