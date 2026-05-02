# NEED TO DO — your turn

> Stuff Claude can't do for you. Three blocks: now, whenever, later.
> Each row = one action, one link, one outcome.

---

## 🚀 RIGHT NOW (5 min, unblocks live deploy)

- [ ] Run `git push origin main` from your terminal
- [ ] Watch CI go green at <https://github.com/MrDemonWolf/howlcast/actions>
- [ ] Done — webhook URL works after deploy finishes

That's it. Everything else is optional or surfaces in the dashboard later.

---

## 🟡 WHENEVER (does not block code work)

### Twitch dev app — 10 min

- [ ] Go to <https://dev.twitch.tv/console/apps/create>
- [ ] **Name:** `HowlCast`
- [ ] **OAuth Redirect URL:** `https://howlcast.mrdemonwolf.workers.dev/auth/twitch/callback` _(placeholder — we use client_credentials grant, this URL is never hit)_
- [ ] **Category:** Application Integration
- [ ] **Client Type:** Confidential
- [ ] **Organization:** None
- [ ] Click Create → copy `Client ID` + generate `Client Secret`
- [ ] Paste into:
  - `apps/server/.env` as `TWITCH_CLIENT_ID=...` and `TWITCH_CLIENT_SECRET=...`
  - GitHub Actions secrets with the same names

> ✅ Your Twitch user id is auto-detected by the setup wizard (`/setup` page). No need to look it up.

### 7TV signup — 5 min

- [ ] Go to <https://7tv.app>
- [ ] Sign in with Twitch → done. Your account exists.
- [ ] Profile → Emotes → upload PNGs
- [ ] Pipeline picks them up on next 12h cron (or hit "Refresh emotes" in dashboard)

### FFZ emotes — 5 min upload + 1–7 days for approval

- [ ] Go to <https://www.frankerfacez.com/>
- [ ] Sign in with Twitch
- [ ] Submit a New Emote → upload PNG → wait for moderator approval
- [ ] After approval, pipeline picks it up

### Resend domain verify — whenever

Real magic-link emails (currently mailpit / console fallback in dev):

- [ ] Go to <https://resend.com/domains> → Add domain
- [ ] Add the SPF / DKIM / DMARC DNS records they show you
- [ ] Wait ~15 min for DNS to propagate + verification
- [ ] Copy the API key → paste as `RESEND_API_KEY` in `.env` + GH Actions secrets

---

## 🟢 LATER (now in the dashboard UI — go fill these in)

Phase 5 shipped — log in and configure these from `/dashboard`:

| What                        | Where in the dashboard                                       |
| --------------------------- | ------------------------------------------------------------ |
| Discord webhooks            | Dashboard → **Notifications** → paste the two URLs           |
| Send invite emails          | Dashboard → **Invite emails** → enter email, magic link goes |
| Add panels                  | Dashboard → **Panels** → Add panel                           |
| Edit bio / pronouns         | Dashboard → **Account**                                      |
| Pop out chat for OBS        | Dashboard → **Chat** → Pop out (or paste `/popout/chat`)     |
| `howlcast.tv` domain attach | After you buy via Cloudflare Registrar (~$30/yr)             |

---

## CI/CD — how it works (reference)

Three workflows in `.github/workflows/`:

- **`ci.yml`** — runs on every push and PR to `main`. Type-check + lint + format check.
- **`deploy.yml`** — runs after `ci.yml` succeeds on `main`. Runs `bun run deploy` (Alchemy → Cloudflare Workers). Smoke-tests `/api/health`.
- **`update-license-year.yml`** — annual cron Jan 1st 06:00 UTC.

Concurrency group is `deploy` so two pushes don't race.
