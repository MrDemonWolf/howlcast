# HowlCast - For the Inner Circle

HowlCast is a self-hosted, invite-only live streaming platform for a single
broadcaster. It runs on Cloudflare Workers and uses GetStream for the live
video and chat path, so streams stay fast everywhere while the surrounding
app — auth, channel page, dashboard, emotes, panels, branding — is fully
under your control. Built for one person who wants Twitch-style streaming
without Twitch.

Stream on your terms. Keep the howl in the den.

## Features

- **Invite-only by design.** A single `is_invited` flag gates chat posting on
  every stream and gates watching on private streams. No tiers, no
  subscriptions, no follower counts.
- **Public or private per stream.** Toggle visibility before going live.
  Public streams let anyone watch (invitees chat); private streams hide
  everything from non-invitees.
- **Cloudflare-native.** Two Workers (web on `howlcast.tv`, API on
  `api.howlcast.tv`), D1 for data, R2 for avatars and panel images, KV for
  emote metadata, all provisioned declaratively via Alchemy.
- **GetStream live path.** RTMPS ingest from OBS, WebRTC playback to
  viewers. Stream content never touches your Workers — they only mint
  short-lived JWTs and serve UI.
- **Multi-provider emotes.** Channel and global emotes pulled from Twitch,
  7TV, BTTV, and FrankerFaceZ using your single Twitch user ID. Refreshed
  every 12 hours plus a manual refresh button on the dashboard.
- **Better Auth with four sign-in methods.** Email + password, username,
  magic link, and passkey. Two-factor authentication built in. Sessions
  share across `howlcast.tv` subdomains.
- **Discord webhooks for go-live.** Two webhooks (public stream and private
  stream) configured from the dashboard, fired automatically when streams
  start and end.
- **White-label ready.** Custom logo, platform name, footer attribution,
  and bare-minimum Privacy Policy and Terms editor live in the broadcaster
  dashboard. Drop in your own brand without touching code.
- **Den-only layout.** One channel page, one streamer, one focused viewing
  experience. No theatre mode, no editorial mode, no decision fatigue.

## Getting Started

Full docs live in [`docs/`](docs/). Start with
[`START-HERE.md`](START-HERE.md) for the two-job onboarding flow, or
[`PRE-FLIGHT.md`](PRE-FLIGHT.md) for the account-setup checklist.

Quick start once accounts are wired:

1. Clone the repository and install dependencies with `pnpm install`.
2. Copy `.env` values into `apps/server/.env`, `apps/web/.env`, and
   `packages/infra/.env` per the manifests in
   [`PRE-FLIGHT.md`](PRE-FLIGHT.md).
3. Run `pnpm db:generate` to materialise the initial migrations.
4. Run `pnpm dev` to boot both Workers locally.
5. Open `http://localhost:3001` for the web app and
   `http://localhost:3000/api/health` for the API health check.

## Tech Stack

| Layer            | Technology                                  |
| ---------------- | ------------------------------------------- |
| Frontend         | Next.js 16, React 19, Tailwind CSS v4       |
| UI primitives    | shadcn/ui, lucide-react                     |
| Backend          | Hono on Cloudflare Workers                  |
| API              | tRPC v11                                    |
| Auth             | Better Auth 1.5 with Drizzle adapter        |
| Database         | Cloudflare D1 (SQLite)                      |
| ORM              | Drizzle                                     |
| Object storage   | Cloudflare R2 (`howlcast-public`, `howlcast-isr`) |
| Cache            | Cloudflare KV (`HOWLCAST_EMOTES`)           |
| Live video and chat | GetStream                                |
| Email            | Resend                                      |
| Infrastructure   | Alchemy                                     |
| Deploy target    | Cloudflare Workers                          |
| Build tooling    | Turborepo, pnpm catalogs, Biome, Husky      |
| Runtime          | Node 20+, pnpm 9+                           |

## Development

### Prerequisites

- Node.js 20 or newer
- pnpm 9 or newer
- Wrangler 4 or newer, authenticated against your Cloudflare account
- A Cloudflare account on the Free plan (Paid is not required)
- A GetStream account with API credentials
- A Resend account with a verified sending domain
- OBS Studio (or any RTMPS-capable encoder) for testing streams

### Setup

1. Install dependencies.

   ```bash
   pnpm install
   ```

2. Generate the initial Drizzle migration from the auth schema.

   ```bash
   pnpm db:generate
   ```

3. Populate `apps/server/.env`, `apps/web/.env`, and `packages/infra/.env`
   with values from your 1Password vault (see
   [`PRE-FLIGHT.md`](PRE-FLIGHT.md)).

4. Boot the dev environment.

   ```bash
   pnpm dev
   ```

5. Deploy to your Cloudflare account when you are ready.

   ```bash
   pnpm deploy
   ```

### Development Scripts

- `pnpm dev` - Run both Workers under Alchemy with hot reload.
- `pnpm dev:web` - Run the web Worker only.
- `pnpm dev:server` - Run the API Worker only.
- `pnpm dev:mail` - Start mailpit (local dev inbox at http://localhost:8025).
- `pnpm dev:mail:stop` - Stop the mailpit container.
- `pnpm dev:mail:logs` - Tail the mailpit container logs.
- `pnpm build` - Build all workspaces via Turborepo.
- `pnpm check-types` - Type-check every workspace.
- `pnpm check` - Run Biome with autofix on the entire repository.
- `pnpm db:generate` - Generate Drizzle migrations from the schema.
- `pnpm db:push` - Push the Drizzle schema directly (skips migration files).
- `pnpm run deploy` - Provision and deploy all Cloudflare resources via Alchemy.
- `pnpm destroy` - Tear down the Alchemy-managed Cloudflare resources.

### Email in development

HowlCast uses three email transports, chosen automatically:

1. If `RESEND_API_KEY` is set, mail goes through Resend. Production path.
2. Else if `SMTP_URL` is set and reachable, mail goes through SMTP. Local
   default points at mailpit on `localhost:1025`. Run `pnpm dev:mail` to
   start mailpit, then open the inbox at http://localhost:8025 to see
   captured emails.
3. Else the email is printed to the server terminal. Zero-setup fallback;
   handy when you just want to click a magic link without spinning Docker.

### Code Quality

- Biome handles linting and formatting in a single pass.
- Husky runs `lint-staged` on `pre-commit` so commits never land malformed code.
- TypeScript is configured with `tsc -b` for incremental project references.
- React Compiler is enabled on the web Worker for automatic memoisation.

## Project Structure

```
howlcast/
├── apps/
│   ├── web/                  # Next.js Worker - howlcast.tv
│   └── server/               # Hono Worker - api.howlcast.tv
├── packages/
│   ├── api/                  # tRPC routers and context
│   ├── auth/                 # Better Auth factory
│   ├── config/               # Shared TypeScript and tooling config
│   ├── db/                   # Drizzle schema, migrations, client factory
│   ├── env/                  # Validated runtime env loaders
│   ├── infra/                # Alchemy resource declarations
│   └── ui/                   # shadcn components and globals.css tokens
├── design-handoff/           # Locked HTML mockups and design tokens
├── docs/                     # Architecture, build plan, integration guides
├── assets/                   # Brand SVGs and logo variants
├── CLAUDE.md                 # AI collaborator instructions
├── DESIGN-DECISIONS.md       # Locked product and design decisions
├── PRE-FLIGHT.md             # Pre-scaffold account setup checklist
├── PROGRESS.md               # Phase-by-phase build progress
└── START-HERE.md             # Top-level onboarding doc
```

## License

![GitHub license](https://img.shields.io/github/license/mrdemonwolf/howlcast.svg?style=for-the-badge&logo=github)

## Contact

- Discord: [Join my server](https://mrdwolf.net/discord)
- Website: [mrdemonwolf.com](https://www.mrdemonwolf.com)

---

Made with love by [MrDemonWolf, Inc.](https://www.mrdemonwolf.com)
