# Claude Code instructions for HowlCast

> This file teaches Claude Code how to work on this project. Update it as decisions change.

## Who I am, how to talk to me

- **Nathanial.** Owner of MrDemonWolf, Inc. (web dev / hosting agency).
- **ADHD + Asperger's.** Be direct, specific, concrete. No vague abstractions.
- **Plain language first.** Technical terms after.
- **Casual tone.** No "I'd be happy to" filler. No corporate hedging.
- **Push back if I'm wrong.** Don't just agree.
- **Lead with the recommendation**, then explain. Don't dump every option.
- **Numbered checkboxes** (`- [ ]`) for any multi-step task.

## Tech defaults you must follow

- **TypeScript over JavaScript.** Always.
- **The stack is locked:** Next.js + Hono + tRPC + Drizzle + D1 + Better Auth + Cloudflare Workers + GetStream.
- **Self-hosted/open-source over SaaS** wherever possible. GetStream is the exception (special pricing plan).
- **Better-T Stack** scaffolds the monorepo. Don't restructure away from BTS conventions unless I explicitly ask.
- **Two Workers, not one.** Web on `howlcast.tv`, server on `api.howlcast.tv`. Cookies use `crossSubDomainCookies` config.
- **Docs site is a third app** (Phase 7 only). Lives at `apps/docs/`, deploys to `docs.howlcast.tv`. Built with Astro + Starlight. Don't start on it until Phase 6 ships.

## Brand

- Colors: deep navy `#091533`, bright cyan `#0FACED`
- Fonts: Bricolage Grotesque (display), Geist Sans (UI), Geist Mono (numbers/codes)
- Dark mode only — never add a light mode
- Wolf-themed but **understated**. No edgy "fangs and blood" energy. Closer to Linear-calm than Twitch-busy.

## Read this before doing anything

1. **[`DESIGN-DECISIONS.md`](DESIGN-DECISIONS.md)** — what's IN, what's OUT, locked from the design handoff. **Most important file.** Don't propose anything that contradicts this.
2. **[`README.md`](README.md)** — overview + current state
3. **[`design-handoff/project/`](design-handoff/project/)** — the actual final HTML mockups. Treat these as visual specs. Match pixel-for-pixel in Next.js.
4. **[`docs/architecture.md`](docs/architecture.md)** — stack, file structure, data flow, schema
5. **[`docs/build-plan.md`](docs/build-plan.md)** — what to build, in order, with checkboxes
6. **[`PROGRESS.md`](PROGRESS.md)** — where I actually am right now

For specific topics:

- Streaming → [`docs/integrations/getstream.md`](docs/integrations/getstream.md)
- Auth → [`docs/integrations/better-auth.md`](docs/integrations/better-auth.md)
- Emotes → [`docs/integrations/emotes.md`](docs/integrations/emotes.md)
- **Roles, isInvited flag, Discord webhooks** → [`docs/roles-and-notifications.md`](docs/roles-and-notifications.md)
- Docs site (Phase 7) → [`docs/docs-site.md`](docs/docs-site.md)
- Open questions → [`docs/decisions.md`](docs/decisions.md)

## How to work on tasks

When I ask you to do something:

1. **Check `PROGRESS.md`** for current state.
2. **Check the relevant docs** to confirm conventions.
3. **Tell me your plan in 3-5 numbered checkboxes** before writing code.
4. **Wait for "go"** unless the task is tiny (1 file, < 30 lines).
5. **Update `PROGRESS.md`** when you finish a phase or major chunk.

If something contradicts the docs, **stop and tell me**. Don't invent your own architecture.

## Things that look like good ideas but aren't

- ❌ **Adding a "mod" role.** Removed by design — broadcaster handles moderation directly via GetStream's built-in tools. Don't add it back without me asking.
- ❌ **Adding subscriber tiers.** No $3/mo, no $8/mo, no tier 1, no tier 2. Removed entirely.
- ❌ **Adding viewer tiers (Inner Circle / Public).** Single `isInvited` boolean replaces all tier logic.
- ❌ **Multi-channel notification fanout** (email, RSS, web push). Just two Discord webhooks. Don't propose more.
- ❌ **Multiple email templates** (sub thank-you, raid alert, etc.). One template only: "Private stream invite".
- ❌ **Theater or Editorial layout variants.** Den only. The other two were removed.
- ❌ **Schedule, Tags, Vods, Subscribe, Follow, Channel URL.** All removed. Don't bring them back.
- ❌ Mounting Hono inside Next.js on the same Worker (BTS doesn't support; trying to hack it = pain)
- ❌ Module-scope `betterAuth(...)` instance (must be per-request factory in Workers)
- ❌ **Re-deriving design tokens.** Use `design-handoff/project/shared.css` verbatim; port to `globals.css` as-is.
- ❌ `@cloudflare/next-on-pages` (deprecated; use `@opennextjs/cloudflare`)
- ❌ MailChannels for email (free path died Aug 2024; use Resend)
- ❌ NextAuth or Clerk (we picked Better Auth)
- ❌ Postgres / MySQL (we're on D1; BTS won't even let you)
- ❌ `drizzle-kit migrate` against D1 (use `wrangler d1 migrations apply`)
- ❌ Adding emoji decoration to the UI (use Lucide line icons inline)
- ❌ Recording or VODs (live only — explicit product choice)
- ❌ Light mode (dark only — explicit product choice)
- ❌ Painting backgrounds with cyan (cyan is for primary CTAs, focus rings, LIVE pulse, brand mark, verified check — used sparingly)

## When you should search the web

- **Always** for present-day facts about Cloudflare, Better Auth, GetStream, BTS, OpenNext, Next.js — these change fast
- **Always** for "is this still the right approach in $current_year"
- **Don't** for general programming knowledge or things in the docs already

## Commit style

- Lowercase imperative subject: `add channel page skeleton`, not `Added channel page`
- Reference the phase: `phase 3: stream key rotation in admin`
- One concept per commit when possible

## When you're unsure

Ask me. Don't guess. I'd rather answer one clarifying question than untangle a wrong assumption.

---

_If this file ever conflicts with my latest message, my message wins. Update this file to match._
