# Decisions & Risks

> **TL;DR:** Open questions you need to answer + known gotchas that will bite if you forget them.

---

## Open decisions to make

These need answers before or during the build. Mark them when you decide.

### 1. ~~Domain name~~ — RESOLVED

**Decision:** `howlcast.tv` (default — bought via Cloudflare Registrar).

### 2. ~~Verified checkmark color~~ — RESOLVED

**Decision:** Cyan starburst circle (custom — NOT Twitter blue, NOT Twitch purple). See `design-handoff/project/shared.css` for the SVG class `.verified`.

### 3. ~~Chat for offline state~~ — RESOLVED

**Decision:** (b) open as a community chat. Chat persists between streams. Public viewers can read; only invited viewers can post (matches the live-mode rules).

### 4. WebRTC vs HLS for viewers

- WebRTC default (sub-second, chat-synced) or HLS default (better mobile data)?
- **Recommendation:** WebRTC for everyone, HLS as opt-in fallback. Chat sync is the killer feature.
- Note: invite-only mode REQUIRES WebRTC (HLS m3u8 isn't auth-gated by default)
- **Decision:** _________________

### 5. ~~Schedule tab~~ — RESOLVED

**Decision:** Removed entirely. No Schedule nav, no Schedule tab. Panels can hold a schedule image if needed, but it's not first-class.

### 6. Public stream archive cleanup

- Spec says "no recording, no VODs, never store stream content"
- Should HLS playlist be auto-cleaned beyond live window?
- Default: GetStream auto-cleans, but worth being explicit
- **Decision:** _________________

### 7. OAuth providers later (Discord/Twitter login)

- Not asked for, but trivial to add to Better Auth
- Worth knowing now if you want to pre-think the user profile model
- **Recommendation:** skip for v1, revisit if community asks
- **Decision:** _________________

### 8. ~~Broadcaster chat view~~ — RESOLVED

**Decision:** (a) `/dashboard/chat` route — chat-only fullscreen view for OBS browser source. Pop-out button on the channel page chat header opens it in a popup window.

### 9. ~~Mod count expectations~~ — RESOLVED

**Decision:** No mods at all. Broadcaster handles all moderation directly via GetStream's built-in tools.

See [`roles-and-notifications.md`](roles-and-notifications.md) for details.

### 9a. ~~Viewer tier model~~ — RESOLVED

**Decision:** No tiers. Single `isInvited` boolean flag on profiles.

- `isInvited = false` (default): can watch public streams, can read chat, cannot post
- `isInvited = true`: can watch private streams, can post in chat
- No tier promotion UI — just a single "send invite" flow

Subscriber tiers ($3+/mo, $8+/mo) are also out — fully removed from Emotes page.

### 9b. ~~Discord webhook setup~~ — RESOLVED

**Decision:** Two-webhook design confirmed.

- Public stream webhook: fires only when `visibility === 'public'`
- Private stream webhook: fires only when `visibility === 'invite_only'`
- Never both — only the matching one fires
- Configured in Dashboard → Channel → Notifications

### 10. ~~Email subdomain for Resend~~ — RESOLVED

**Decision:** `mail.howlcast.tv` (cleaner than apex, doesn't conflict with future MX records).

### 11. White-label feature scope

- **Recommendation:** custom logo + custom platform name + footer attribution toggle (default / custom / off)
- "Off" might require a paid HowlCast license tier — TBD whether that's a thing for v1
- **Decision:** _________________

### 12. Privacy / Terms editor

- Bare-minimum WYSIWYG (rich text: bold, italic, headings, links, lists)?
- Or full markdown editor?
- **Recommendation:** WYSIWYG via Tiptap (lighter than full markdown, friendlier for non-technical edits, easier on mobile)
- **Decision:** _________________

---

## Risks and gotchas

These are real things that bite. Most have already been worked around in the docs, but listed here so you don't forget.

### Stack-level risks

- **`@cloudflare/next-on-pages` is deprecated.** If any tutorial references it, ignore. Use `@opennextjs/cloudflare`.
- **OpenNext SSRF (CVE-2026-3125).** Pin `@opennextjs/cloudflare ≥ 1.17.1`. Older versions leak ISR cache via `\` path bypass on `/cdn-cgi/image/`.
- **Better Auth 1.4.x had `trustedOrigins` regressions on Hono+Workers.** Pin ≥ 1.5.
- **Better Auth instance per-request.** Module-scope = 33-second hangs and 503 cascades in production.
- **`@stream-io/node-sdk` may not work in Workers.** Sign JWTs manually with WebCrypto.
- **MailChannels free Workers integration is dead** (sunset Aug 2024). Old tutorials are stale.
- **Passkey RP ID can't be `*.workers.dev`.** Public suffix list rejects it. Need custom domain.
- **The Better Auth CLI binary changed.** Old `@better-auth/cli` → new `npx auth` in 1.5+.

### Cloudflare risks

- **D1 has no interactive transactions.** Better Auth handles via `batch()`. Don't write Postgres-style transactional code.
- **Wrangler env `vars` and `services` don't inherit between `[env.*]` blocks.** Redeclare per environment.
- **Cron triggers don't auto-fire in `wrangler dev`.** Use `--test-scheduled` + `/__scheduled?cron=...`.
- **R2 custom domains require apex on Cloudflare.** Buy domain through Cloudflare or transfer DNS first.

### Streaming risks

- **HLS playback URLs are NOT auth-protected.** Invite-only mode MUST use WebRTC.
- **GetStream Chat throttles features above 100 concurrent watchers.** Typing indicators, read receipts auto-disabled. Expected.
- **Stream key rotation drops OBS connection mid-stream.** Always rotate when offline.
- **Live viewer count drift between WebRTC and HLS.** Use `participants_count_by_role` for WebRTC; count separately if mixing.
- **Bundle size:** SDKs are 200KB+ minified. Code-split per-route.

### Emote risks

- **Twitch animated emotes need `format=animated`** in URL or you get static fallback.
- **7TV uses `connection_id` in some endpoints, Twitch ID in others.** Verify per fetcher.
- **No documented rate limits on 3 providers, only Twitch.** Cron at 15min is safe.
- **BTTV returns shared + channel separately.** Merge at fetch time.

### UI/UX risks

- **`partitioned: true` cookies are non-negotiable** for Safari ITP / Chrome CHIPS. Forget this and Safari auth silently breaks.
- **Cyan overuse kills the design.** Discipline: only on primary CTA, focus rings, LIVE pulse, brand mark, verified check.
- **Dark mode only.** Don't add a toggle unless someone explicitly asks. It doubles design + testing surface.

### Operational risks

- **No GitHub Actions in BTS.** Write your own deploy workflow or use Workers Builds.
- **`bun create` has Wrangler edge cases.** Use pnpm.
- **Hono + tRPC adapter version drift.** Pin major versions in `package.json`.
- **`drizzle-kit migrate` doesn't work against D1.** Use `wrangler d1 migrations apply`.

---

## Decisions log

_When you decide an open question above, log it here with the date and reasoning._

| # | Decision | Date | Why |
|---|---|---|---|
| 1 | `howlcast.tv` domain | 2026-05-01 | Default; bought via Cloudflare Registrar |
| 2 | Cyan starburst verified mark | 2026-05-01 | Brand cohesion, distinct from Twitter/Twitch |
| 3 | Chat open between streams | 2026-05-01 | Community persists; matches Discord-adjacent vibe |
| 5 | Schedule tab removed | 2026-05-01 | Single-streamer platform doesn't need it; panels can hold schedule image |
| 8 | `/dashboard/chat` for OBS browser source | 2026-05-01 | Pop-out button on channel page chat header |
| 9 | No mods role | 2026-05-01 | Broadcaster handles all moderation directly |
| 9a | No viewer tiers; single `isInvited` flag | 2026-05-01 | Subscribers fully removed; tier system collapsed |
| 9b | Two Discord webhooks (public + private) | 2026-05-01 | Discord channel permissions handle audience routing |
| 10 | `mail.howlcast.tv` for Resend | 2026-05-01 | Subdomain isolation, no MX conflicts |
| — | Single layout (Den only) | 2026-05-01 | Theater + Editorial removed during design phase |
| — | One email template (Private stream invite) | 2026-05-01 | Sub thank-you / starting / request templates removed |
| — | White-label feature in scope | 2026-05-01 | Custom logo + name + footer attribution toggle |
| — | Bare-min PP / TOS WYSIWYG editor | 2026-05-01 | Settings-driven, simple rich text |
