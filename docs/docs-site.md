# Docs Site

> **Live at:** `https://mrdemonwolf.github.io/howlcast/` once GitHub Pages is enabled in repo Settings → Pages → Source: GitHub Actions.

## Stack

- **Fumadocs** (Next.js + MDX) — mirrors [`MrDemonWolf/fangdash`](https://github.com/MrDemonWolf/fangdash) docs setup
- **Static export** via Next.js `output: "export"` → outputs to `apps/docs/out/`
- **GitHub Pages** as host. Workflow at `.github/workflows/deploy-docs.yml`.
- **`basePath: /howlcast`** in production (since GH Pages serves under `/howlcast/`)

Astro Starlight + Cloudflare Pages was the original recommendation; superseded by fangdash continuity.

## Layout

```
apps/docs/
├── package.json                       # @howlcast/docs, fumadocs deps
├── next.config.mjs                    # output: export, basePath /howlcast
├── source.config.ts                   # fumadocs-mdx config
├── postcss.config.mjs                 # Tailwind v4
├── tsconfig.json                      # extends @howlcast/config base
├── mdx-components.tsx                 # injects Steps + Step
├── global.d.ts                        # CSS module + .source declarations
├── next-env.d.ts                      # Next.js types
├── app/
│   ├── layout.tsx                     # RootProvider + dark default
│   ├── global.css                     # Tailwind + Fumadocs CSS + brand vars
│   ├── (home)/page.tsx                # landing page
│   └── docs/
│       ├── layout.tsx                 # DocsLayout shell
│       └── [[...slug]]/page.tsx       # MDX renderer
├── lib/
│   ├── source.ts                      # fumadocs source loader
│   ├── layout.shared.tsx              # nav config (HowlCast title + Live + GitHub links)
│   └── constants.ts                   # APP_URL + REPO_URL
└── content/docs/
    ├── meta.json                      # top-level pages order
    ├── index.mdx                      # docs landing
    ├── getting-started/               # prerequisites + quickstart
    ├── deploy/                        # cloudflare-setup + d1-and-r2 + secrets + first-deploy
    ├── configure/                     # first-run-wizard + getstream + resend + twitch-emotes + branding + notifications
    ├── operate/                       # going-live + invites + panels + chat-popout + moderation + streamer-mode + analytics
    ├── reference/                     # architecture + schema + env-vars + trpc-routes + webhooks + design-decisions
    ├── troubleshooting/               # common-issues + obs-not-pushing + chat-not-working
    └── changelog.mdx
```

## Brand theme

`apps/docs/app/global.css` overrides Fumadocs's CSS variables with HowlCast brand:

- Light mode preserved as a fallback (Fumadocs's RootProvider defaults to dark)
- Dark mode: navy `#091533` bg, cyan `#0FACED` accent
- Sidebar uses a slightly darker navy for hierarchy

Fonts use Fumadocs defaults (system stack + Geist Mono for code) — Bricolage / Geist not pulled in here. Overkill for a docs site.

## Local dev

```bash
bun install
bun run --filter @howlcast/docs dev
# → http://localhost:3002
```

Port 3002 to avoid conflict with `apps/web` (3001) and `apps/server` (3000).

## Build

```bash
bun run --filter @howlcast/docs build
# → apps/docs/out/ (static HTML)
```

The `postinstall` hook generates `.source/` from MDX files via `fumadocs-mdx`. Build then runs `next build`. Static export honors `basePath` only in `NODE_ENV=production`.

## Deploy

`.github/workflows/deploy-docs.yml` triggers on push to main when `apps/docs/**` or migration files change. Mirrors the fangdash workflow exactly:

1. Setup Bun
2. Cache `~/.bun/install/cache`
3. `bun install --frozen-lockfile`
4. `bun run --filter @howlcast/docs build`
5. `touch apps/docs/out/.nojekyll`
6. `actions/configure-pages@v5` + `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`

`.nojekyll` is required because GH Pages would otherwise apply Jekyll rules and strip files starting with `_` (which Next's static export uses).

## Phase 7 status

See [`PROGRESS.md`](../PROGRESS.md) Phase 7 section. Most items checked. Remaining:

- [ ] User: Repo Settings → Pages → Source: GitHub Actions
- [ ] Real screenshots after first OBS stream
- [ ] Search (Pagefind) — deferred
- [ ] Custom domain `docs.howlcast.tv` — deferred (would require GitHub Pages CNAME setup + Cloudflare DNS)

## Why Fumadocs not Starlight

Original plan was Astro Starlight. Replaced because:

1. **Continuity with fangdash** — same maintainer, same patterns, same workflow. One mental model.
2. **Next.js familiarity** — main app is Next.js. Same framework reduces context switch.
3. **MDX ergonomics** — Fumadocs `Steps`/`Step` components are great for setup walkthroughs.
4. **GitHub Pages + Next static export** — works out of the box. No Cloudflare bill, no DNS futzing.

## Why GitHub Pages not Cloudflare

- Free, no DNS work needed
- Same as fangdash
- Defer the custom domain decision

If we want `docs.howlcast.tv` later: add a `CNAME` file to `apps/docs/public/` containing the custom domain, then point a CNAME DNS record at `mrdemonwolf.github.io` in Cloudflare DNS.
