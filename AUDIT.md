# HowlCast Code Audit — Pre-Phase-6 Launch

**Date:** 2026-05-08
**Scope:** `apps/{web,server}` + `packages/{api,auth,db,env,mail,ui,config,infra}` (131 TS/TSX files)
**Method:** Direct read of critical files, cross-cut grep, `bun run check-types`, `bun run lint`.

## Summary

| Severity | Count | Meaning                                    |
| -------- | ----- | ------------------------------------------ |
| H        | 8     | Block launch — security or correctness gap |
| M        | 14    | Fix soon — tech debt, perf, hygiene        |
| L        | 9     | Post-launch polish                         |

Top three blockers: lint pipeline is broken in 9 packages (273 parse errors), `check-types` only covers 3 of 10 packages so type drift in `auth`/`db`/`env`/`mail` ships unchecked, broadcaster-guard pattern is duplicated 4× across routers.

---

## 1. Security

- `packages/api/src/lib/stream.ts:167` — `verifyStreamWebhook` rejects only when `hex.length !== sigHeader.length`. Correct, but length-comparison short-circuits before timing-safe compare; that's a tiny leak (length oracle). Since both are HMAC-hex of fixed 32 bytes, length is constant — fine in practice but document the assumption. [L]
- `apps/server/src/index.ts:103-126` — webhook verification only runs for live/end events; `chat.message.new` and others are accepted with `{ok: true}` and no signature check. Comment says "HMAC is only enforced for events that trigger DB writes"; that's correct but the endpoint is publicly callable so an attacker can spam unsigned bodies. Add a tight allowlist of event types that bypass HMAC (currently implicit). [M]
- `apps/server/src/index.ts:54-97` — `/api/upload/logo` has no rate limit and no per-broadcaster quota. 1 MB max but a broadcaster can spam writes to R2 + D1. [M]
- `packages/api/src/routers/channel.ts:102-117` — `refreshEmotes` mutation is broadcaster-gated but unbounded; calls 4 third-party APIs + KV write per invocation. Add a server-side cooldown (e.g. min 30 s since last `updatedAt`). [M]
- `packages/api/src/routers/admin.ts:85-116` — `createInvite` has no rate limit; broadcaster could be hijacked and used as a spam vector via `sendMail`. Cap invites/hour per account. [M]
- `packages/api/src/routers/admin.ts:111` — invite email body interpolates `cfg.title ?? "the den"` directly into HTML with no escaping. `title` is validated `z.string().max(140)` only — any `<` or `"` user-supplied lands raw in HTML. Subject too. Escape both. [H]
- `packages/mail/src/templates/magic-link.ts:36,48` — `magicUrl` interpolated raw into `href` attributes and visible URL text. better-auth-generated URLs are safe today, but any future URL-templating change can produce attribute-injection. HTML-escape on render. [M]
- `packages/api/src/routers/setup.ts:82-184` — `commit` is `publicProcedure` (correct, pre-auth) but has no rate limit / lockout. An attacker can hit `lookup`+`commit` in a race window before legitimate setup runs. Add a one-shot install token (env `SETUP_TOKEN`) or IP-based throttle. [H]
- `packages/api/src/routers/admin.ts:135-155` — `acceptInvite` is `protectedProcedure`. Comment at line 132 says "Public — called from /invite/[code]" — code and comment disagree; if it should be public, current state breaks the flow. Verify intent. [H]
- `packages/api/src/routers/admin.ts:135-155` — `acceptInvite` does no expiration check on `inv.expiresAt` being null (undefined `expiresAt < new Date()` is a type/logic risk). Drizzle returns `Date | null` so the `inv.expiresAt && inv.expiresAt < new Date()` guard is correct — verified. Keep. [—]
- `packages/api/src/routers/branding.ts:46` — `customLogoKey` accepts arbitrary string up to 200 chars on update. The upload route mints keys server-side, but this route lets a broadcaster point at any R2 key including those uploaded by other paths or future bucket contents. Constrain to `^branding/logo-[a-f0-9]{16}\.(svg|png|jpg)$`. [M]
- `apps/server/src/index.ts:21-27` — CORS uses `env.CORS_ORIGIN` (single string) with `credentials: true`. If `CORS_ORIGIN` env is misconfigured to `*`, Hono's cors will reject browser requests, but an attacker-served subdomain can't be enforced from a single string. Fine for single-tenant — flag if you ever multi-tenant. [L]
- `packages/api/src/routers/stream.ts:64,108,158` — `apiKey: env.STREAM_API_KEY` returned to public viewers. Intentional (GetStream model), but worth confirming the key is public-tier and not the secret. Confirmed: secret is `STREAM_API_SECRET`, only used server-side. [—]
- `packages/api/src/routers/channel.ts:69-91` — `updateConfig` re-checks ownership against `channelConfig.ownerId` instead of using the shared `assertBroadcaster`. Inconsistent. [L]
- `apps/web/src/middleware.ts:18-36` — `getSetupStatus` fails open (`return true`) on any error. Acceptable for pre-setup gate (no lockout), but log so a broken API doesn't silently bypass the funnel. [L]
- `packages/api/src/lib/sanitize-html.ts:13-23` — `defaultSchema` from `rehype-sanitize` is the safe baseline; `attributes.a` adds `target` + `rel` but no enforcement that `rel="noopener noreferrer"` is set when `target="_blank"`. Add a rehype pass to inject `rel`. [M]

## 2. Workers / Cloudflare correctness

- `apps/web/src/middleware.ts:18` — module-scope `let cachedStatus`. Cloudflare Workers DO recycle isolates so this acts as a hot-path cache, but it can leak request-tied state across users _only_ if the cache stores user-scoped data. Here it stores a global boolean (`setupCompleted`) so it's safe — but the comment doesn't say "must be request-agnostic". Add a guard. [L]
- `apps/server/src/index.ts:29` — `createAuth()` instantiated per-request (correct factory pattern). Also at line 55. [—]
- `packages/auth/src/index.ts:21-85` — `createAuth` is the per-request factory. Correct. [—]
- `packages/db/src/index.ts:6` — `createDb()` is a fresh drizzle instance per call. Correct for D1, but every router calls `createDb()` 1-3× per procedure. Consolidate by adding `db` to tRPC `Context` and consume `ctx.db`. ~70 redundant `createDb()` calls today. [M]
- `packages/api/src/routers/setup.ts:172` — `result.headers as Headers & { getSetCookie?: () => string[] }` — runtime-feature-test cast. Accept; documented inline. [—]
- `apps/server/src/index.ts:70` — `raw as Blob & { type: string; size: number; name?: string }` cast; bypasses type but constraints are checked at runtime via `ALLOWED_LOGO_TYPES` + `MAX_LOGO_BYTES`. Acceptable. [L]

## 3. Duplicates

- `assertBroadcaster` defined **four** times: `packages/api/src/lib/broadcaster-guard.ts:11`, `packages/api/src/routers/channel.ts:203`, `packages/api/src/routers/admin.ts:17`, and inline checks in `routers/stream.ts:128,184,224,240,258` and `routers/channel.ts:82,105`. The shared helper exists — use it everywhere. [H]
- `siteRow()` / `loadConfig()` / inline `db.select().from(channelConfig).where(eq(channelConfig.id, "site"))` repeats in `setup.ts:31`, `stream.ts:23`, `channel.ts:23,78,104`, `admin.ts:19`, `branding.ts:20`, `apps/server/src/index.ts:60,167`. Consolidate to a `getSiteConfig(db)` helper. [M]
- `getTwitchAppToken` exists in both `packages/api/src/lib/emotes.ts:38` and `packages/api/src/lib/twitch.ts:22` with near-identical bodies. Pick one (the `twitch.ts` form takes a `creds` object; the `emotes.ts` form takes individual args). Export from `twitch.ts` and import. [H]
- `TWITCH_TOKEN_KEY` constant duplicated `emotes.ts:26`, `twitch.ts:6`. [L]
- Profile-role lookup `me.role !== "broadcaster"` repeats in `stream.ts:99,128,258`, `account.ts:118`. Bake into `assertBroadcaster` (returns role). [M]
- `apps/web` has its own `Avatar`, `Button`, `Eyebrow` etc. imports from `@howlcast/ui/components/*` — good, no actual duplication. [—]
- `SITE_ID = "site"` constant declared 6× across routers. Move to `packages/api/src/constants.ts`. [L]

## 4. Dead code / scaffold

- `packages/api/src/routers/index.ts:13-18` — `privateData` procedure (`This is private`) is BTS scaffold, no caller. Delete. [M]
- `packages/api/src/routers/index.ts:10-12` — `healthCheck` procedure unused — `apps/server/src/index.ts:42` already has `/api/health`. Remove the tRPC version. [L]
- `packages/api/src/context.ts:13` — `auth: null` field in context, never set or read. Remove. [L]
- `apps/web/src/components/channel/channel-page.tsx:281-285` — `TagRow` returns null; comment admits it's a placeholder. Either delete or land actual feature. [L]
- `apps/web/src/components/header.tsx:27` — bare `{}` JSX expression on its own line is a no-op. Remove. [L]

## 5. Type safety

- `apps/web/src/components/channel/live-chat.tsx:125-126` — `getRehypePlugins: (defaults) => [...] as any` with eslint-disable. Acceptable (3rd-party type gap), but file an upstream issue to remove later. [L]
- `apps/web/src/components/channel/emote-renderer.test.ts:38` — `(c: any)` casts in test. OK to leave in test. [L]
- `apps/web/src/components/channel/channel-page.tsx:126,156,164` — `credentials.data!.callId!` non-null assertions chain. The surrounding `canMountStream` guard makes this safe, but it's brittle. Narrow with a type-guard function `assertCreds(creds): creds is Required<...>`. [L]
- `packages/api/src/routers/account.ts:63` — `patch: Record<string, unknown>` then assigned typed fields. Type accurately as `Partial<typeof profiles.$inferInsert>`. [L]

## 6. tRPC hygiene

- `packages/api/src/routers/admin.ts:135` — `acceptInvite` inconsistent: comment says public, decoration is `protectedProcedure`. (Same finding as Security.) [H]
- `packages/api/src/routers/setup.ts` — every procedure is `publicProcedure` because pre-auth. Locked behind `assertNotCompleted`, so safe once setup runs. Confirmed. [—]
- `packages/api/src/routers/channel.ts:189-200` — `reorderPanels` runs N updates serially in a loop (line 194). D1 has no transaction wrapper here — partial failure leaves panels half-renumbered. Wrap in `db.batch([...])`. [M]
- `packages/api/src/routers/channel.ts:161-167` — `db.select().from(panels).orderBy(asc(panels.position)).all().then(rs => rs[rs.length-1]?.position + 1)` selects ALL panel rows just to get the max position. Use `db.select({ max: sql\`max(position)\` })`. [M]
- All routers: error messages leak DB shape (e.g. "Channel not initialized"). Fine for a single-tenant install — keep. [—]

## 7. Drizzle / D1

- `packages/db/src/schema/channel.ts:43` — `channelConfig` has no index on `ownerId` even though most lookups by `ownerId` happen via `id = "site"` so it's a non-issue (single-row table). Confirmed — keep. [—]
- `packages/db/src/schema/channel.ts:71` — `panels` has only a `position` index; lookups by `id` use the PK. OK. [—]
- `packages/db/src/schema/channel.ts:89` — `invites.usedBy` and `invites.createdBy` lack indexes. `listInvites` orders by `createdAt`. Add `created_at_idx` for the listing query. [L]
- `packages/db/src/schema/channel.ts:122` — `streamSessions` has `started_idx`. Aggregation in `stream.getStats` scans 7 days — fine. [—]
- `packages/db/src/schema/channel.ts:170-180` — `userBans` schema unused; no router writes/reads. Either ship Phase 6 enforcement or remove the table from migrations to keep schema lean. [M]
- `packages/api/src/routers/account.ts:108-126` — `deleteMe` deletes `user` row, relying on FK cascades. Cascade exists on `session`/`account`/`profiles` but **not** `invites.usedBy` (no `onDelete` defined `channel.ts:94`). Stranded `usedBy` strings post-deletion. [M]
- `packages/db/src/schema/channel.ts:43-67` — `channelConfig.ownerId` references `user.id` but no `onDelete` clause. Delete the broadcaster row → orphaned config. Currently blocked by `account.deleteMe` precondition, but the schema should match the rule. [M]

## 8. Next.js boundaries

- `apps/web/src/app/page.tsx` — server component that just renders `<ChannelPage/>`. ChannelPage is `'use client'`. Fine. [—]
- `apps/web/src/components/channel/channel-page.tsx:1` — `'use client'`. The whole channel surface ships to the client even though `info`, `panels`, branding could SSR via tRPC server-side helpers. Phase-6 perf win. [M]
- `apps/web/src/lib/use-white-label.ts:12` — `process.env.NEXT_PUBLIC_PUBLIC_BUCKET_URL` accessed in a client file. With Next.js 15 + opennext this needs to be in `packages/env/src/web.ts`'s `client:` section to type-check + bake at build time. Currently typed loose `?? "https://pub.howlcast.tv"`. [M]
- `apps/web/src/components/header.tsx:28` — uses raw `<img>` for custom logos to skip remote-pattern config. Eslint rule `no-img-element` is off (correct), comment explains why. [—]

## 9. Brand / design

- Hardcoded `#091533` and `#0FACED` in: `apps/web/src/app/layout.tsx:70`, `apps/web/src/app/opengraph-image.tsx:42-74`, `apps/web/src/app/global-error.tsx:14-45`, `apps/web/src/app/{terms,privacy}/opengraph-image.tsx`, `packages/api/src/lib/discord.ts:22`, `packages/mail/src/templates/magic-link.ts` (multiple). OG images run in Edge runtime where CSS vars don't resolve — hex is correct there. Email HTML has the same constraint (mail clients). `global-error.tsx` runs outside the providers — also correct to hardcode. Discord embed color is an int, not CSS. **Verdict: all hardcoded hex is justified.** Leave. Document in a `BRAND_TOKENS.md` to prevent drift later. [L]

## 10. Config

- `bun run lint` — **273 parse errors**, all "No tsconfigRootDir was set" caused by ESLint resolving multiple `tsconfig.json` candidates (from the `.claude/worktrees/` symlink). Lint is effectively dead. Set `parserOptions.tsconfigRootDir` in `eslint.config.mjs` or add `.claude/` to `ignores`. [H]
- `eslint.config.mjs:10-30` — `ignores` does not include `.claude/**` — that's the source of the worktree leak above. [H]
- `bun run check-types` — only 3 of 10 packages have `check-types` script. `apps/web`, `@howlcast/auth`, `@howlcast/config`, `@howlcast/db`, `@howlcast/env`, `@howlcast/infra`, `@howlcast/mail` all skip type-checking in CI. [H]
- `apps/web/package.json` — has `test` but no `check-types`. Next.js compiles in `build` but PR-time type errors only surface on full build. Add `tsc --noEmit`. [H]
- `eslint.config.mjs:64` — `@typescript-eslint/no-explicit-any` set to `warn`. With lint broken, no warnings surface. Bump to `error` once lint pipeline is fixed. [M]
- `eslint.config.mjs` — no `@typescript-eslint/no-floating-promises` rule. Workers without `ctx.waitUntil(...)` for fire-and-forget async are easy to write — see `apps/server/src/index.ts:176` (no await on `fanOutDiscord` inside the handler — actually it IS awaited). Adding the rule prevents future bugs. [M]
- `eslint.config.mjs` — no `import/no-cycle`, no `import/order`. [L]
- `turbo.json:7` — `inputs: ["$TURBO_DEFAULT$", ".env*"]`. `.env*` causes cache misses on env changes — good. But `outputs: ["dist/**", ".next/**"]` for `build` doesn't list `.open-next/**` which is what actually deploys. [M]
- `turbo.json:13-15` — `lint` and `check-types` tasks have no explicit `inputs` and rely on turbo defaults; that's fine but missing `outputs: []` means turbo treats them as buildable, allocating cache space pointlessly. Add `"outputs": []`. [L]
- `turbo.json:30-49` — `deploy` task lists 16 env vars but lacks `EMOTES_KV` binding name, `STREAM_WEBHOOK_SECRET` (if separate), `NEXT_PUBLIC_PUBLIC_BUCKET_URL`. Reconcile against `packages/infra/alchemy.run.ts`. [M]
- `tsconfig.json` (root) is just `extends @howlcast/config/tsconfig.base.json` — fine. Verify `strict: true` in the base. (Not read.) [L]
- 6 packages (`auth`, `config`, `db`, `env`, `mail`, `infra`) have `package.json` but no `scripts.check-types` and no `scripts.lint` of their own. Turbo `^check-types` does nothing for them. [H]
- `package.json:9-33` — workspace catalog uses `typescript: ^6` (not yet released stable as of date) — verify `bun install` resolved an actual TS 6 build. [M]

---

## Verification spot-checks

- `apps/server/src/index.ts:70` cast: confirmed in file.
- `packages/api/src/lib/stream.ts:167` length compare: confirmed.
- `apps/web/src/middleware.ts:18` module-scope cache: confirmed.
- `packages/api/src/routers/admin.ts:111` HTML interpolation: confirmed.
- `packages/api/src/routers/admin.ts:135` `protectedProcedure` vs "Public" comment: confirmed contradiction.

## Recommended fix order (Phase 6 polish)

1. **Lint pipeline** — add `.claude/**` to ignores + set `tsconfigRootDir` in `eslint.config.mjs`. [H, 5 min]
2. **check-types coverage** — add `"check-types": "tsc --noEmit"` to all 7 packages missing it; add to `apps/web` too. [H, 30 min]
3. **HTML escape in admin.createInvite** + magic-link template. [H, 15 min]
4. **Setup token / install lockout** for `setup.commit`. [H, 30 min]
5. **acceptInvite intent** — flip to `publicProcedure` if comment is canonical, else fix comment. [H, 5 min]
6. **assertBroadcaster consolidation** — replace 4 inlined copies with the shared helper. [H, 30 min]
7. **getTwitchAppToken dedup** — collapse to one. [H, 10 min]
8. Defer all M / L to a follow-up branch.

## Verification (run after fixes)

- `bun run check-types` — all 10 packages green.
- `bun run lint` — 0 errors.
- Manual: trigger `setup.commit` twice, second call must 409.
- Manual: send invite with `cfg.title = '<script>x</script>'`, recipient inbox shows escaped text.
