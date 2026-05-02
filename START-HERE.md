# 👉 START HERE 👈

> **Hey, future-you.** Open this file first. Read top to bottom. Don't skip ahead.
>
> Design ✅ done. Logo ✅ picked (Howl Arc). All you have left is the practical setup work, then start Claude Code.

---

## You have **2 jobs** in this exact order

```
   ☐  JOB 1 · Set up workspaces      (~95-120 min)
   ☐  JOB 2 · Start Claude Code      (paste the prompt, Claude grinds)
```

That's it. No design work left. No more decisions to make on scope.

---

## ☐ JOB 1 · Set up everything (~95-120 min)

**Open `PRE-FLIGHT.md` and work through all 9 steps.**

Quick rundown so you know what's coming (don't do this from memory — open the file):

```
1. Cloudflare account + Wrangler                   (10 min)
2. Buy howlcast.tv domain                          ( 5 min)
3. GetStream signup + grab API keys                (10 min)
4. Resend signup + verify mail subdomain DNS       (15 min)
5. Twitch dev app + grab client ID/secret          (10 min)
6. 7TV / BTTV / FFZ channel IDs (no signup)        (10 min)
7. Discord webhooks (public + private)             (10 min)
8. GitHub repo + Jira project + Drive + 1Password  (20 min)
9. Local dev tools check                           ( 5 min)
```

By the end you'll have:
- 14 secrets in 1Password
- A GitHub repo (`mrdemonwolf/howlcast`)
- A Jira project (key: `HC`, kanban board)
- A Google Drive folder (with subfolders)
- All accounts created and verified

**This is the boring step.** Do it once. Never touch it again.

✅ When all 9 steps have checks — **move to Job 2.**

---

## ☐ JOB 2 · Start Claude Code

**1. Scaffold the project:**

```bash
cd ~/dev   # or wherever you keep your projects

pnpm create better-t-stack@latest howlcast \
  --frontend next --backend hono --runtime workers \
  --api trpc --database sqlite --orm drizzle --db-setup d1 \
  --auth better-auth --addons turborepo biome husky \
  --package-manager pnpm --web-deploy cloudflare --server-deploy cloudflare \
  --yes

cd howlcast
```

**2. Drop the docs into the repo:**

```bash
# unzip howlcast-docs.zip into the repo root so it ends up at:
#   howlcast/howlcast-docs/
```

**3. Open Claude Code in that folder:**

```bash
claude
```

**4. Paste this kickoff prompt:**

```
Read these files in order, then summarize what you understand and tell me the
next concrete action:

1. howlcast-docs/CLAUDE.md
2. howlcast-docs/DESIGN-DECISIONS.md
3. howlcast-docs/docs/architecture.md
4. howlcast-docs/docs/build-plan.md  (Phase 1 only for now)
5. howlcast-docs/PROGRESS.md
6. howlcast-docs/docs/branding-spec.md  (Phase 5 spec — read for full context)

Then list the design files in howlcast-docs/design-handoff/project/ and tell
me which file you'll reference for which build phase.

Wait for me to confirm before starting Phase 1.
```

Claude Code reads everything, summarizes, asks you to confirm, then starts building.

**That's it.** You're done.

---

## What if I forget where I am?

Open Claude Code, paste:

```
Read howlcast-docs/PROGRESS.md and howlcast-docs/CLAUDE.md.
Tell me which phase I'm in, what's the next unchecked box, and what to do.
```

You'll never get lost. PROGRESS.md is the source of truth.

---

## Quick map of this folder

```
START-HERE.md            ← you are here
README.md                ← project overview
DESIGN-DECISIONS.md      ← what's IN, what's OUT (locked) ★
PROGRESS.md              ← what's done · update as you go ★
PRE-FLIGHT.md            ← Job 1 walkthrough
CLAUDE.md                ← rules for Claude Code

design-handoff/          ★ THE ACTUAL DESIGN ★
  project/               (9 HTML mockups + shared.css)

docs/
  architecture.md        ← stack + schema
  build-plan.md          ← all 7 phases ★
  branding-spec.md       ← white-label + PP/TOS spec
  decisions.md           ← decision log
  roles-and-notifications.md
  docs-site.md           ← Phase 7
  integrations/

assets/
  brand-assets.html      ← preview your logo + variants
  logos/                 (5 final SVGs — Howl Arc)
```

★ = the most important files

---

## Pep talk (for ADHD brain)

The hard parts are done:
- ✅ Spec'd the entire product
- ✅ Made every design decision
- ✅ Locked in the role model
- ✅ Cut every "maybe we should add..." that wasn't core
- ✅ Got Claude Design to ship 9 polished HTML mockups
- ✅ Picked the Howl Arc logo + produced all 5 final SVGs
- ✅ Wrote the schema, the build plan, all the integration docs

What's left is **mechanical execution**. Job 1 is boring (90 minutes of clicks). Job 2 is fun (Claude Code does the work). You don't have to invent anything — just paste, click, confirm, repeat.

If you spiral, come back here. Two jobs. In order. That's it.

🐺 *Howl when ready.*
