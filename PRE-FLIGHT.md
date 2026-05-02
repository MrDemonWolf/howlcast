# Pre-Flight: What to grab before scaffolding

> **TL;DR:** ~90 minutes of clicking around to set up accounts and grab keys. Do all of this BEFORE running the BTS scaffold. Save tokens to a 1Password vault as you go.

## What you're collecting

By the end of this checklist, you'll have:

- A domain you own
- 9 environment variable values
- A few DNS records configured
- A 1Password vault you can copy-paste from

**Save everything in 1Password as you collect it.** Don't store secrets in plain text files. Don't paste into ChatGPT or unrelated tools.

---

## Order to do this in (and rough time)

```
1. Cloudflare account + Wrangler CLI                 ~10 min
2. Domain purchase (howlcast.tv)                     ~5 min
3. GetStream account + app creation                  ~10 min
4. Resend account + domain verification              ~15 min (DNS prop time)
5. Twitch developer app (for emote API)              ~10 min
6. 7TV / BTTV / FFZ channel IDs (no signup)          ~10 min
7. Discord webhooks (public + private)               ~10 min
8. Workspace setup (GitHub + Jira + Drive + 1Pass)   ~20 min
9. Local dev tools check                             ~5 min

Total: ~95-120 minutes
```

---

## Step 1 — Cloudflare account + Wrangler CLI

You probably already have an account from MrDemonWolf, Inc. Reuse it.

- [ ] **1.1** Go to **https://dash.cloudflare.com**, log in
- [ ] **1.2** **Free plan is fine.** D1, R2, KV, Cron triggers, and custom domains on Workers are all on the Free tier as of 2026. Single-broadcaster traffic stays well under the 100k req/day Worker limit. Only upgrade to Paid ($5/mo) if you actually hit a quota — not preemptively.
- [ ] **1.3** Note your **Account ID** (right sidebar of any Cloudflare dashboard page) → save in 1Password as `CLOUDFLARE_ACCOUNT_ID`
- [ ] **1.4** Create an **API token** for local Wrangler use:
  - Profile (top-right) → API Tokens → Create Token
  - Use template: **"Edit Cloudflare Workers"**
  - Resources: All zones, All accounts (or scope tighter if you want)
  - Save token in 1Password as `CLOUDFLARE_API_TOKEN`
- [ ] **1.5** Install Wrangler globally:
  ```bash
  bun add -g wrangler
  ```
- [ ] **1.6** Authenticate:
  ```bash
  wrangler login
  ```
  This opens a browser tab, click Allow, you're done.

---

## Step 2 — Domain purchase

- [ ] **2.1** Decide: `howlcast.tv` (default) or alternative (`lupinr.tv`, `denlive.tv`)
- [ ] **2.2** In Cloudflare dashboard: **Domain Registration → Register Domain**
- [ ] **2.3** Search `howlcast.tv`, buy it (~$30/yr for `.tv`)
- [ ] **2.4** Confirm purchase. DNS is automatically managed by Cloudflare.
- [ ] **2.5** Note: you'll add subdomain DNS records later (`api.`, `docs.`) — skip for now

**Why Cloudflare Registrar:** at-cost pricing, free WHOIS privacy, no upsells, DNS is already there. Don't use Namecheap/GoDaddy and then transfer.

---

## Step 3 — GetStream account + app

- [ ] **3.1** Go to **https://getstream.io/** → Sign up
- [ ] **3.2** You mentioned having a special pricing plan — make sure you're on it (or contact GetStream support to confirm before doing anything else)
- [ ] **3.3** Create a new application:
  - Dashboard → **Create App**
  - Name: `HowlCast`
  - Region: **US East** (closest to Beloit, WI)
  - Environment: **Production** (you can also create a separate dev app later)
- [ ] **3.4** Grab the keys (App → Overview):
  - **API Key** → save as `STREAM_API_KEY` in 1Password
  - **API Secret** → save as `STREAM_API_SECRET` in 1Password
- [ ] **3.5** Note your **App ID** (just for reference, not needed in env vars)
- [ ] **3.6** **Don't configure webhooks yet.** That's a Phase 3 task once you have a deployed Worker URL.
- [ ] **3.7** **Don't configure channel types or roles yet.** Phase 3 also.

---

## Step 4 — Resend account + domain verification

This is the longest step because DNS propagation. Start it, then do other things while waiting.

- [ ] **4.1** Go to **https://resend.com** → Sign up (use your business email)
- [ ] **4.2** Domains → **Add Domain**
- [ ] **4.3** Enter `mail.howlcast.tv` (subdomain, NOT the apex — keeps your main MX clean)
- [ ] **4.4** Resend shows you 3 DNS records to add (SPF TXT, DKIM CNAME, DMARC TXT). Copy them.
- [ ] **4.5** In Cloudflare: **DNS → Records** → add all 3 exactly as shown:
  - Set proxy status to **DNS only** (gray cloud, not orange) — Resend records must NOT be proxied
- [ ] **4.6** Back in Resend, click **Verify**. Initial verification may take 5–60 minutes.
- [ ] **4.7** Once verified: **API Keys → Create API Key**
  - Name: `howlcast-production`
  - Permission: **Sending access** (NOT full access)
  - Domain: `mail.howlcast.tv`
  - Save key as `RESEND_API_KEY` in 1Password
- [ ] **4.8** Test it: send a test email to yourself from the Resend dashboard

**If verification stalls:** SPF/DKIM/DMARC are picky. Use **https://mxtoolbox.com/** to inspect what's actually published — sometimes Cloudflare's UI obscures trailing dots or quotes that matter.

---

## Step 5 — Twitch developer app

Needed for fetching emotes (global + channel) via the Helix API.

- [ ] **5.1** Go to **https://dev.twitch.tv/console** → Log in with your Twitch account
- [ ] **5.2** **Applications → Register Your Application**
- [ ] **5.3** Fill in:
  - **Name:** `HowlCast Emote Fetcher`
  - **OAuth Redirect URLs:** `https://howlcast.tv/auth/twitch/callback` (placeholder — won't actually be used since we only need app tokens, but Twitch requires a value)
  - **Category:** Application Integration
  - **Client Type:** Confidential
- [ ] **5.4** Click Create. On the app page:
  - Save **Client ID** as `TWITCH_CLIENT_ID` in 1Password
  - **New Secret** → save as `TWITCH_CLIENT_SECRET` in 1Password (you can only see this once — copy immediately)
- [ ] **5.5** Note your **Twitch user ID**:
  - Go to **https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/**
  - Enter your username (e.g. `mrdemonwolf`)
  - Copy the numeric ID → save as `BROADCASTER_TWITCH_ID` in 1Password
  - This is used to fetch your channel emotes from all 4 providers

---

## Step 6 — 7TV / BTTV / FFZ channel IDs

No signup needed — these are public APIs. You just need IDs.

- [ ] **6.1** **Twitch ID** → already grabbed above as `BROADCASTER_TWITCH_ID`. BTTV and FFZ both use Twitch ID directly.
- [ ] **6.2** **7TV connection ID** → fetch with curl:
  ```bash
  curl https://7tv.io/v3/users/twitch/YOUR_TWITCH_ID | jq '.id'
  ```
  Save as `SEVENTV_USER_ID` in 1Password (only needed if you have a 7TV account linked to your Twitch — otherwise skip)
- [ ] **6.3** **BTTV** uses Twitch ID directly, no extra step
- [ ] **6.4** **FFZ** uses Twitch ID directly, no extra step
- [ ] **6.5** Quick test that the APIs work for your IDs:
  ```bash
  # Should return JSON with your emotes
  curl https://7tv.io/v3/users/twitch/YOUR_TWITCH_ID | jq '.emote_set.emotes | length'
  curl https://api.betterttv.net/3/cached/users/twitch/YOUR_TWITCH_ID | jq '.channelEmotes | length'
  curl https://api.frankerfacez.com/v1/room/id/YOUR_TWITCH_ID | jq '.sets'
  ```

If any of these return empty / 404, you don't have channel emotes on that platform yet. That's fine — globals will still load, you can add channel emotes later.

---

## Step 7 — Discord webhooks (for live notifications)

You need **two Discord channels** in your server, each with a webhook URL.

- [ ] **7.1** In your Discord server (or create one), make two text channels:
  - `#announcements` (or similar) — for **public stream** notifications
  - `#inner-circle-live` (private channel, restricted to your trusted folks) — for **private stream** notifications
- [ ] **7.2** For each channel, click the gear icon → **Integrations → Webhooks → New Webhook**
- [ ] **7.3** Name them clearly:
  - "HowlCast — Public" for the public channel webhook
  - "HowlCast — Private" for the private channel webhook
- [ ] **7.4** Copy each webhook URL → save in 1Password:
  - `DISCORD_WEBHOOK_PUBLIC` (public stream notifications)
  - `DISCORD_WEBHOOK_PRIVATE` (private stream notifications)
- [ ] **7.5** **Don't paste these into env vars yet.** They get configured in the admin dashboard once HowlCast is deployed (Phase 5). For now, just stash them.
- [ ] **7.6** Set Discord channel permissions on the private channel so only invited members of your community can see it. This is what actually keeps private streams private on the Discord side.

**Why two webhooks instead of one with logic:** the Discord side handles who sees what. If you reorganize channels later, you just paste new URLs into HowlCast — no code changes.

---

## Step 8 — Workspace setup (GitHub + Jira + Drive + 1Password)

This step creates the four places where the project actually lives. Do it once, never touch it again.

### 8a. GitHub repo

- [ ] **8.1** Create a new private GitHub repo: **https://github.com/new**
  - Owner: `mrdemonwolf` (or your org)
  - Name: `howlcast`
  - Visibility: **Private** (flip to public once docs ship in Phase 7)
  - Don't initialize with README — BTS will scaffold one
- [ ] **8.2** Add **branch protection** on `main`:
  - Settings → Branches → Add rule for `main`
  - Require pull request reviews before merging: **off** (you're solo)
  - Require status checks to pass: **on** (will be wired up in Phase 6)
  - Require linear history: **on**
- [ ] **8.3** Add **secrets** (Settings → Secrets and variables → Actions):
  - `CLOUDFLARE_API_TOKEN` (paste from 1Password)
  - `CLOUDFLARE_ACCOUNT_ID`
  - These are for GitHub Actions deployment in Phase 6 — paste now to skip context-switching later

### 8b. Jira project

- [ ] **8.4** Go to **https://[your-domain].atlassian.net** (your existing Atlassian workspace)
- [ ] **8.5** Create a new project:
  - Name: `HowlCast`
  - Key: `HC` (auto-suggested)
  - Type: **Software** → **Kanban** (not Scrum — you're not running sprints)
  - Lead: yourself
- [ ] **8.6** Create columns to match build phases:
  - `Backlog` → `Phase 1: Foundation` → `Phase 2: Auth` → `Phase 3: Streaming` → `Phase 4: Chat` → `Phase 5: Dashboard` → `Phase 6: Polish` → `Phase 7: Docs` → `Done`
- [ ] **8.7** Create labels for cross-cutting work:
  - `bug`, `chore`, `tech-debt`, `client-blocker` (if MrDemonWolf, Inc. client work overlaps), `nice-to-have`
- [ ] **8.8** **Bulk-import build plan tasks** — the simplest way:
  - Open `docs/build-plan.md` in your editor
  - Copy each `- [ ]` line into a Jira CSV import (Project settings → Import data)
  - OR use the **PackRunner skill** you have to bulk-create from labels (per your past chat history)

### 8c. Google Drive folder

- [ ] **8.9** Go to **https://drive.google.com**
- [ ] **8.10** Create a new folder under your business root: `MrDemonWolf, Inc. → Internal Projects → HowlCast`
- [ ] **8.11** Inside, create subfolders:
  - `Design` — for design exports, references, screenshots
  - `Legal` — for PP/TOS drafts, GetStream contracts, etc.
  - `Brand` — for logo final files, OG images, marketing assets
  - `Ops` — for backups, runbook PDFs, vendor invoices
- [ ] **8.12** Set **sharing**:
  - Top-level `HowlCast` folder → Restricted (just you for now)
  - Doesn't need to be shared with anyone else since you're solo

### 8d. 1Password vault

- [ ] **8.13** Create a 1Password vault:
  - Name: `HowlCast`
  - Type: Personal (not shared, unless you're going to give someone else access later)
  - Add all secrets you've collected so far
  - Make sure each entry has a clear name matching the env var

**Your 1Password vault should now have:**

| Entry name | Value |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | (from step 1) |
| `CLOUDFLARE_API_TOKEN` | (from step 1) |
| `STREAM_API_KEY` | (from step 3) |
| `STREAM_API_SECRET` | (from step 3) |
| `RESEND_API_KEY` | (from step 4) |
| `TWITCH_CLIENT_ID` | (from step 5) |
| `TWITCH_CLIENT_SECRET` | (from step 5) |
| `BROADCASTER_TWITCH_ID` | (from step 5) |
| `SEVENTV_USER_ID` | (from step 6, if you use 7TV) |
| `DISCORD_WEBHOOK_PUBLIC` | (from step 7) |
| `DISCORD_WEBHOOK_PRIVATE` | (from step 7) |
| `GITHUB_REPO_URL` | from 8.1 — `git@github.com:mrdemonwolf/howlcast.git` |
| `JIRA_PROJECT_URL` | from 8.5 — `https://[your-domain].atlassian.net/jira/software/projects/HC` |
| `DRIVE_FOLDER_URL` | from 8.10 — paste the folder share link |

Plus 2 you'll generate during scaffold:

| Entry name | When |
|---|---|
| `BETTER_AUTH_SECRET` | During Phase 1 — generate with `openssl rand -hex 32` |
| `STREAM_WEBHOOK_SECRET` | Phase 3 — set when configuring GetStream webhook |

**Note:** Discord webhook URLs are NOT env vars — they get pasted into the admin dashboard once HowlCast is deployed (Phase 5). They live in the database (`webhooks` table), not in code.

### 8e. Cross-link everything

- [ ] **8.14** In the GitHub repo description, paste the Jira project URL + Drive folder URL
- [ ] **8.15** In the Jira project description, paste the GitHub repo URL + Drive folder URL
- [ ] **8.16** Pin the 1Password vault to your sidebar so it's one click away during dev

That way no matter where you start (GitHub / Jira / Drive), you can hop to the others in one click. ADHD-proof workspace.

---

## Step 9 — Local dev tools check

- [ ] **9.1** Node version 20+: `node -v`
- [ ] **9.2** bun 1.3+: `bun -v`
- [ ] **9.3** Wrangler 4+: `wrangler -v`
- [ ] **9.4** Git: `git --version`
- [ ] **9.5** Modern terminal (you have Ghostty — good)
- [ ] **9.6** OBS Studio installed (for testing streams in Phase 3)
- [ ] **9.7** A working RTMPS-aware test setup. Plan to test Phase 3 from your actual streaming PC with your real OBS scenes.

---

## Final env var reference

This is exactly what'll live in `apps/server/.dev.vars` and as Worker secrets:

```bash
# Cloudflare (set in wrangler config, not .dev.vars)
# CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are for Wrangler CLI

# Better Auth
BETTER_AUTH_SECRET=...                  # Generate: openssl rand -hex 32
BETTER_AUTH_URL=http://localhost:3000   # In prod: https://api.howlcast.tv
CORS_ORIGIN=http://localhost:3001       # In prod: https://howlcast.tv

# Email
RESEND_API_KEY=re_...

# GetStream
STREAM_API_KEY=...
STREAM_API_SECRET=...
STREAM_WEBHOOK_SECRET=...               # Set during webhook configuration

# Twitch (for emote API)
TWITCH_CLIENT_ID=...
TWITCH_CLIENT_SECRET=...
BROADCASTER_TWITCH_ID=...               # Your numeric Twitch user ID

# Optional
SEVENTV_USER_ID=...                     # Only if you use 7TV
```

Web app needs only the public ones in `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SERVER_URL=http://localhost:3000   # In prod: https://api.howlcast.tv
NEXT_PUBLIC_STREAM_KEY=...                     # Same value as STREAM_API_KEY
```

---

## Done? Now scaffold.

When all 9+ items are in 1Password and DNS records are verified:

```bash
bun create better-t-stack@latest howlcast \
  --frontend next \
  --backend hono \
  --runtime workers \
  --api trpc \
  --database sqlite \
  --orm drizzle \
  --db-setup d1 \
  --auth better-auth \
  --addons turborepo biome husky \
  --package-manager bun \
  --web-deploy cloudflare \
  --server-deploy cloudflare \
  --yes
```

Then start working through [`PROGRESS.md`](PROGRESS.md) Phase 1 checkboxes.

---

## Common snags

- **Resend domain won't verify** → DNS prop is slow on Cloudflare Registrar sometimes. Wait 30 min, retry.
- **Wrangler `login` opens wrong account** → run `wrangler logout` first, then `wrangler login` again
- **GetStream "free plan" warning** → contact GetStream support to confirm your special plan is active before scaffolding
- **Twitch app secret lost** → you can rotate it (regenerates), but you can never recover it. Save immediately.
- **Cloudflare Account ID has spaces or hyphens** → it's a 32-char hex string. If yours looks weird you copied a different ID. Look in the right sidebar of any dashboard page.
- **`.dev.vars` is in .gitignore** → confirm before committing. BTS scaffold should set this. If not, add it manually.
