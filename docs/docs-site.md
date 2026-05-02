# Docs Site

> **TL;DR:** Add Starlight (Astro) as a third app in the monorepo. Hosts a landing page + setup guide at `docs.howlcast.tv`. Build in Phase 7 after the platform actually works.

## What you'll find here

1. Why a docs site, why now
2. Tech pick (Starlight, with reasoning)
3. What the docs site IS
4. Content outline (the actual pages)
5. Where it lives in the monorepo
6. Deployment
7. Phase 7 checkboxes
8. The "coming soon" middle ground

---

## Why now (and why not earlier)

**The trap:** writing setup docs before you've deployed the thing yourself = guessing. You'll write 3000 words, then rewrite half of them when you hit real-world friction during Phase 1–6.

**The right time:** after Phase 6 ships. By then you've:

- Run the BTS scaffold yourself
- Hit every gotcha in the docs we wrote
- Deployed to real Cloudflare
- Watched OBS push to GetStream
- Felt where the friction is

**That's** when you write the setup guide. Your notes from Phases 1–6 ARE the setup guide.

**Earlier exception:** put up a "coming soon" landing page during Phase 6. That's a 2-hour task and worth it to claim the brand presence on `docs.howlcast.tv` or wherever you land.

---

## Tech pick: Starlight (Astro)

**Recommendation: Starlight.** It's an addon in Better-T Stack already, so adding it is one command.

| Option                | Pros                                                                                        | Cons                                                 | Verdict                                      |
| --------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------- |
| **Starlight (Astro)** | Fastest, less JS, killer default theme, built-in Pagefind search, BTS addon, Markdown-first | Different framework from main app                    | **Pick this**                                |
| Fumadocs (Next.js)    | Same framework as main app, also a BTS addon                                                | Heavier, more JS shipped, slower for content         | Skip — extra weight not worth same-framework |
| Nextra (Next.js)      | Mature, popular                                                                             | Less polished defaults than Starlight                | Skip                                         |
| Mintlify              | Beautiful                                                                                   | SaaS only, not self-hosted (violates your principle) | Skip                                         |
| Docusaurus            | Mature, plugin ecosystem                                                                    | React-heavy, slower, dated UX                        | Skip                                         |
| VitePress             | Fast, simple                                                                                | Vue-based (you're React/TS)                          | Skip                                         |

**Don't worry about "two frameworks."** Astro for the docs site is fine. It's content, not an app — no shared state, no shared components needed. You write `.mdx` and it builds static HTML.

---

## What the docs site IS

**It is:**

- A public landing page describing HowlCast
- A complete deploy-it-yourself guide for someone who wants to run their own HowlCast instance
- Reference docs for configuration, environment variables, troubleshooting
- The public face of the project (if you ever open-source it)

**It is NOT:**

- The HowlCast app itself (that's `howlcast.tv`)
- Your private notes (those are in `docs/` in the repo)
- A blog (no posts, no CMS — just docs)

**Domain options:**

- `docs.howlcast.tv` — clean, recommended
- `howlcast.dev` — if you want to separate marketing/docs from the running platform
- `howlcast.tv/docs` — subpath, harder to deploy independently

**Recommendation: `docs.howlcast.tv`.** Same brand, easy SSL, deploys independently.

---

## Content outline

The full sitemap. Each `*.mdx` page in `apps/docs/src/content/docs/`:

```
/                                  → Landing page (hero, features, CTA)
/quickstart/                       → "Get HowlCast running in 30 min"
/guides/
  ├── getting-started/             → What HowlCast is, who it's for
  ├── prerequisites/               → CF account, GetStream, Resend, domain
  ├── deploy/
  │   ├── cloudflare-setup/        → Account, Wrangler, domain, DNS
  │   ├── d1-and-r2/               → Creating DB, buckets, KV
  │   ├── secrets/                 → Setting Worker secrets
  │   └── first-deploy/            → Running the scaffold + first deploy
  ├── configure/
  │   ├── getstream/               → Sign up, get keys, set up app
  │   ├── resend/                  → Domain verification, magic links
  │   ├── twitch-emotes/           → Twitch app + 7TV/BTTV/FFZ IDs
  │   └── first-run-wizard/        → Walking through the in-app setup
  ├── operate/
  │   ├── going-live/              → OBS settings, RTMPS URL, stream key
  │   ├── moderation/              → Slow mode, bans, mod tools
  │   ├── invites/                 → Public vs invite-only, generating codes
  │   ├── panels-and-emotes/       → Channel customization
  │   └── upgrading/               → Updating to new HowlCast versions
  └── troubleshooting/
      ├── auth-not-working/
      ├── stream-key-issues/
      ├── chat-not-loading/
      └── safari-cookies/
/reference/
  ├── env-vars/                    → All required + optional env vars
  ├── architecture/                → How it all fits (diagram + prose)
  ├── database-schema/             → Drizzle tables, relationships
  ├── api-routes/                  → tRPC procedures + REST endpoints
  ├── webhooks/                    → GetStream events you care about
  └── permissions/                 → Roles, grants, what each can do
/about/                            → Who built it, why, MrDemonWolf brand
/changelog/                        → Versioned release notes
```

**That's ~25 pages.** Most are short (<500 words). The deploy guide is the biggest piece — figure 2000 words across 4–5 pages.

---

## Where it lives

```
howlcast/                          # the monorepo
├── apps/
│   ├── web/                       # howlcast.tv (Next.js)
│   ├── server/                    # api.howlcast.tv (Hono)
│   └── docs/                      # docs.howlcast.tv (Starlight) ← NEW
│       ├── src/
│       │   ├── content/docs/      # all the .mdx pages
│       │   ├── styles/            # custom navy/cyan theme
│       │   ├── components/        # custom React/Astro components
│       │   └── assets/            # screenshots, diagrams
│       ├── astro.config.mjs       # Starlight config
│       ├── public/                # favicons, OG images
│       ├── wrangler.jsonc         # Cloudflare deployment
│       └── package.json
```

Add it via BTS:

```bash
cd howlcast
pnpm bts add
# Choose: Documentation Site → Starlight
```

Or manually scaffold Starlight if `bts add` doesn't expose the right options:

```bash
cd apps
pnpm create astro@latest docs --template starlight --no-git --install
```

Then add it to `pnpm-workspace.yaml` and `turbo.json`.

---

## Theme matching

Starlight's theme is overridable via CSS custom properties. Drop this in `apps/docs/src/styles/custom.css`:

```css
:root {
	--sl-color-accent-low: #0a2547;
	--sl-color-accent: #0faced; /* HowlCast cyan */
	--sl-color-accent-high: #b3eaff;
	--sl-color-white: #ffffff;
	--sl-color-gray-1: #e6eaf2;
	--sl-color-gray-2: #b3bccc;
	--sl-color-gray-3: #7d8699;
	--sl-color-gray-4: #4d5566;
	--sl-color-gray-5: #2a2f3d;
	--sl-color-gray-6: #1a1f2d;
	--sl-color-black: #091533; /* HowlCast navy */
}

/* Force dark mode only — match the rest of HowlCast */
:root[data-theme="light"] {
	color-scheme: dark;
}
```

Reference in `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
	integrations: [
		starlight({
			title: "HowlCast",
			description: "Self-hosted live streaming for one streamer",
			logo: { src: "./src/assets/logo.svg" },
			customCss: ["./src/styles/custom.css"],
			social: { github: "https://github.com/mrdemonwolf/howlcast" },
			sidebar: [
				{ label: "Quickstart", link: "/quickstart" },
				{ label: "Guides", autogenerate: { directory: "guides" } },
				{ label: "Reference", autogenerate: { directory: "reference" } },
			],
		}),
	],
});
```

---

## Deployment

Starlight builds to static HTML. Two deploy options:

**Option A — Cloudflare Workers Static Assets (recommended):**

```bash
cd apps/docs
pnpm build
pnpm wrangler deploy
```

With this `wrangler.jsonc`:

```jsonc
{
	"name": "howlcast-docs",
	"compatibility_date": "2026-05-01",
	"assets": { "directory": "./dist" },
	"routes": [{ "pattern": "docs.howlcast.tv", "custom_domain": true }],
}
```

**Option B — Cloudflare Pages (if you prefer the dashboard):**

- Connect the GitHub repo
- Build command: `cd apps/docs && pnpm build`
- Build output: `apps/docs/dist`
- Custom domain: `docs.howlcast.tv`

Either way: **static HTML, zero runtime cost, free tier covers you forever.**

---

## Phase 7 — Docs Site

Adding to the master plan. Sequence after Phase 6 (launch).

- [ ] **7.1** Decide domain (`docs.howlcast.tv` recommended)
- [ ] **7.2** Add DNS record for the subdomain in Cloudflare
- [ ] **7.3** Add Starlight: `pnpm bts add` (pick docs site → Starlight) OR manual scaffold
- [ ] **7.4** Add the new app to `pnpm-workspace.yaml` and `turbo.json`
- [ ] **7.5** Drop in custom theme CSS (navy/cyan)
- [ ] **7.6** Replace Starlight default logo with your HowlCast SVG
- [ ] **7.7** Build the **landing page** — match the design tokens from `design-handoff/project/shared.css`. Aim for: hero with H1 + lede + dual CTAs (View on GitHub / Read quickstart), feature grid, "free tier covers it" cost breakdown, footer.
- [ ] **7.8** Write `/quickstart/index.mdx` (~500 words, "30 min from zero to live")
- [ ] **7.9** Write `/guides/getting-started/`
- [ ] **7.10** Write `/guides/prerequisites/`
- [ ] **7.11** Write `/guides/deploy/cloudflare-setup/`
- [ ] **7.12** Write `/guides/deploy/d1-and-r2/`
- [ ] **7.13** Write `/guides/deploy/secrets/`
- [ ] **7.14** Write `/guides/deploy/first-deploy/`
- [ ] **7.15** Write `/guides/configure/getstream/`
- [ ] **7.16** Write `/guides/configure/resend/`
- [ ] **7.17** Write `/guides/configure/twitch-emotes/`
- [ ] **7.18** Write `/guides/configure/first-run-wizard/`
- [ ] **7.19** Write `/guides/operate/going-live/`
- [ ] **7.20** Write `/guides/operate/moderation/`
- [ ] **7.21** Write `/guides/operate/invites/`
- [ ] **7.22** Write `/guides/operate/panels-and-emotes/`
- [ ] **7.23** Write `/guides/operate/upgrading/`
- [ ] **7.24** Write troubleshooting pages (4 of them, short)
- [ ] **7.25** Write reference pages (env vars, architecture, schema, routes, webhooks, permissions)
- [ ] **7.26** Write `/about/` and `/changelog/`
- [ ] **7.27** Add OG image generator (Astro has good options) for sharing
- [ ] **7.28** Add screenshots from real running HowlCast (use macOS screenshots cropped to 16:9)
- [ ] **7.29** Build search via Pagefind (built into Starlight, just enable)
- [ ] **7.30** Add favicon + Apple touch icons (same set as main app)
- [ ] **7.31** Set up Cloudflare Web Analytics on the docs site
- [ ] **7.32** Deploy to `docs.howlcast.tv`
- [ ] **7.33** Add cross-links: `howlcast.tv` footer → docs, docs → main app

**Done when:** somebody who's never seen HowlCast can read the docs and have it running on their own Cloudflare account in under 30 minutes.

---

## The "coming soon" middle ground

If you want SOMETHING up on `docs.howlcast.tv` before Phase 7, do this during Phase 6 polish (~2 hours):

- [ ] Quick add Starlight (steps 7.3–7.6 above)
- [ ] Replace the default home page with a single-screen landing page:
  - HowlCast logo (large)
  - Tagline: "Self-hosted live streaming for one streamer"
  - One sentence about what it does
  - "Docs coming soon" with a date
  - Link to your main channel (`howlcast.tv`)
- [ ] Deploy to `docs.howlcast.tv`

That's it. Don't write content yet. Don't build out subpages. Just claim the URL and put a polished placeholder up. Full docs are still Phase 7.

---

## Gotchas

- **Don't write docs from memory.** Write them while you're building Phase 1–6 — keep a `~/Notes/howlcast-build.md` open and dump notes as you go. Phase 7 then becomes "edit the dump."
- **Screenshots get stale fast.** Take them once, late in Phase 6 when the UI is polished. Don't take them during Phase 3.
- **Don't mix marketing copy with technical docs.** Landing page is marketing. Everything else is technical. Different voice, different pages.
- **The deploy guide is the most important page.** It's what gets shared. Spend disproportionate effort polishing it.
- **Test the deploy guide on a fresh Cloudflare account** before declaring it done. Get a friend to follow it cold. Watch where they get stuck. Fix those parts.
- **Starlight uses MDX.** You can drop React components in pages. Don't go wild — keep most pages plain Markdown so you can edit them on a phone if needed.
- **Pagefind search is great but needs `pnpm build` to update the index.** Re-deploy after every doc change.
- **OG images for the docs site need their own design.** Don't reuse the channel page OG. Use a per-page generator that takes the page title and renders it on a navy/cyan background.

---

## What goes in `apps/docs/README.md`

A short file for future-you (or contributors):

````md
# HowlCast Docs

The docs site for HowlCast. Built with Astro + Starlight.

## Develop

```bash
pnpm dev    # start dev server on :4321
```
````

## Deploy

```bash
pnpm build && pnpm wrangler deploy
```

## Structure

- `src/content/docs/` — all the docs pages (.mdx)
- `src/styles/custom.css` — navy/cyan theme
- `astro.config.mjs` — Starlight config
- `public/` — static assets

## When you change content

Just edit the .mdx file. `pnpm dev` hot-reloads.

## When you change theme

Edit `src/styles/custom.css`, restart `pnpm dev`.

```

```
