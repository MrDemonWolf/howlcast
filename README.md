# HowlCast

> Self-hosted Twitch-style live streaming platform for a single broadcaster. Built on Cloudflare + GetStream. Den-not-arena vibe.

**Status:** planning / pre-scaffold · design locked
**Owner:** MrDemonWolf, Inc. (Nathanial)
**Brand:** navy `#091533` + cyan `#0FACED` + wolf

---

## 👉 START HERE

> **Lost? Confused? Open [`START-HERE.md`](START-HERE.md).** It walks you through the 2 jobs ahead of you in order, with no decisions to make.

---

## What HowlCast is

- Live streaming site for **one streamer** (you, single-tenant install)
- **GetStream** runs the video + chat
- **Cloudflare** runs everything else (Workers, D1, R2, KV)
- **Login required** to watch
- **Public OR Private** stream — toggle per stream
- **Single permission flag** (`isInvited`) — gates chat posting + private-stream watching
- **Two Discord webhooks** — public stream URL + private stream URL
- **No mods** — broadcaster handles all moderation directly
- **No subscribers, no tiers** — explicitly out of scope
- **Live only** — no VODs, no recordings
- **Dark only** — no light mode toggle
- **White-labelable** — custom logo, custom platform name, custom footer

## The stack at a glance

| Layer | Pick |
|---|---|
| Scaffold | **Better-T Stack** (`create-better-t-stack@3.27+`) |
| Frontend | Next.js 16 (App Router) |
| Backend | Hono + tRPC v11 (separate Worker) |
| DB | Cloudflare D1 + Drizzle ORM |
| Storage | Cloudflare R2 (3 buckets) + KV + Images |
| Auth | Better Auth ≥1.5 (username, 2FA TOTP, passkey, magic link) |
| Streaming | GetStream Video + Chat SDKs |
| UI | shadcn/ui + Tailwind v4 |
| Hosting | Cloudflare Workers (web/api/docs all on `*.howlcast.tv`) |
| Email | Resend (3k/mo free) |

## Where to look for what

| You need... | Read this |
|---|---|
| **Where do I start?** | [`START-HERE.md`](START-HERE.md) |
| **What's IN, what's OUT (locked)** | [`DESIGN-DECISIONS.md`](DESIGN-DECISIONS.md) ★ |
| **Final design mockups** | [`design-handoff/project/`](design-handoff/project/) ★ |
| **Brand assets (Howl Arc · locked)** | [`assets/brand-assets.html`](assets/brand-assets.html) (open in browser) |
| **Set up accounts/tokens** | [`PRE-FLIGHT.md`](PRE-FLIGHT.md) |
| Where you are right now | [`PROGRESS.md`](PROGRESS.md) |
| Claude Code instructions | [`CLAUDE.md`](CLAUDE.md) |
| Architecture deep dive | [`docs/architecture.md`](docs/architecture.md) |
| Build plan (7 phases) | [`docs/build-plan.md`](docs/build-plan.md) |
| **Roles, isInvited, Discord webhooks** | [`docs/roles-and-notifications.md`](docs/roles-and-notifications.md) |
| **Branding / white-label spec** | [`docs/branding-spec.md`](docs/branding-spec.md) |
| GetStream integration | [`docs/integrations/getstream.md`](docs/integrations/getstream.md) |
| Better Auth setup | [`docs/integrations/better-auth.md`](docs/integrations/better-auth.md) |
| Emote pipeline | [`docs/integrations/emotes.md`](docs/integrations/emotes.md) |
| Docs site (Phase 7) | [`docs/docs-site.md`](docs/docs-site.md) |
| Open questions | [`docs/decisions.md`](docs/decisions.md) |

---

## Right now: 2 jobs in order

```
   Job 1: SETUP WORKSPACES  (~95-120 min) — Cloudflare, GetStream, etc + GitHub + Jira + Drive
   Job 2: SCAFFOLD + BUILD  (Claude Code takes over)
```

**Open [`START-HERE.md`](START-HERE.md). Everything else flows from there.**

---

## The story you're telling yourself

You're not building Twitch. You're building a private den where you and your community gather around your stream. It's small, intentional, on-brand, and you own all of it. The UI is calm and dark. The cyan is rare and meaningful. The wolf is in the corners — present, never shouting.

When in doubt, ask: **"Is this thing pulling toward Twitch's clutter or toward Linear's calm?"** Pick calm.

---

*Made with care for the den.*
