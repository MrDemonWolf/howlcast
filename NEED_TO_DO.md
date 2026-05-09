# NEED TO DO — your turn

> Stuff Claude can't do for you. Each row = one action, one outcome.

---

## 🚀 RIGHT NOW (unblocks launch)

- [ ] **Hard live OBS test** end-to-end:
  1. Dashboard → **Set up your stream** (one click)
  2. Copy RTMPS URL + key into OBS
  3. Click **Start Streaming** in OBS
  4. Click **Go live** in dashboard
  5. Verify LIVE badge appears on `tv.mrdemonwolf.com`
  6. Verify Discord webhooks fire (public + private)
  7. Verify chat works for broadcaster + anonymous viewer
  8. After **End**: verify Stats shows non-zero peak viewers + chat count + per-session detail charts (`/dashboard/stats/[id]`)
- [ ] **GetStream — confirm Chat webhook URL configured.** Dashboard → Chat → Webhook URL → `https://tv-api.mrdemonwolf.workers.dev/api/webhooks/getstream` subscribed to `message.new`. Without it, chat counts stay at 0.
- [ ] **GetStream — enable participant join/left events.** Video webhook (same URL) subscribed to `call.session_participant_joined` + `call.session_participant_left`. Without these, viewer counts stay at 0.
- [ ] **Delete orphan workers** in Cloudflare dashboard: `howlcast` + `howlcast-api` (left over from rename).

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
