# Mail

> **TL;DR:** Three-tier transport. Resend (prod) → SMTP/mailpit (local dev) → console.log fallback. Picked automatically by `@howlcast/mail` based on env vars.

## What you'll find here

1. Transport tiers
2. Local dev with mailpit
3. Production with Resend
4. Adding a new template

## Transport tiers

`packages/mail/src/index.ts` exports `sendMail(env, msg)`. It picks the transport based on env at call time:

| Tier | Trigger | Notes |
|---|---|---|
| 1. Resend | `env.RESEND_API_KEY` set | HTTPS API. Works on Cloudflare Workers, no SMTP needed. Production path. |
| 2. SMTP | `env.SMTP_URL` set + reachable | Lazy-loads `nodemailer`. Catches failed connection and falls through to tier 3. |
| 3. Console | always | Pretty-prints subject + recipient + plain-text body to the server terminal. Zero-setup. |

`MAIL_FROM` defaults to `HowlCast <invites@mail.howlcast.tv>` and is overridable via env.

## Local dev with mailpit

[Mailpit](https://github.com/axllent/mailpit) is a small Docker SMTP server with a web UI inbox. Captures every outgoing email and renders the HTML.

```bash
bun run dev:mail        # start the container (idempotent)
bun run dev:mail:logs   # tail logs
bun run dev:mail:stop   # stop
```

Inbox: <http://localhost:8025>. SMTP listens on `localhost:1025` (matches the default `SMTP_URL` in `apps/server/.env`).

If mailpit isn't running, the SMTP attempt fails fast and `sendMail` falls through to console.log so dev never blocks on Docker.

## Production with Resend

1. Verify `mail.howlcast.tv` in Resend (PRE-FLIGHT step 4).
2. Set `RESEND_API_KEY` as a Cloudflare Worker secret (and a GitHub Actions secret for CI deploys).
3. Done. `sendMail` will pick Resend automatically because `RESEND_API_KEY` takes priority over `SMTP_URL`.

## Adding a new template

Templates live in `packages/mail/src/templates/`. Each exports a function that returns `{ subject, html, text }`.

Pattern:

```ts
// packages/mail/src/templates/welcome.ts
export interface WelcomeTemplateInput {
	displayName: string;
	streamUrl: string;
}

export function welcomeEmail({ displayName, streamUrl }: WelcomeTemplateInput) {
	return {
		subject: "Welcome to HowlCast",
		html: `<!doctype html>...`,
		text: `Welcome, ${displayName}. Your stream lives at ${streamUrl}.`,
	};
}
```

Caller:

```ts
import { sendMail } from "@howlcast/mail";
import { welcomeEmail } from "@howlcast/mail/templates/welcome";

await sendMail(env, { to: user.email, ...welcomeEmail({ displayName, streamUrl }) });
```

Keep templates inline-styled — many email clients strip `<style>` blocks. Use the navy/cyan palette via hex: `#0a1224` bg, `#0FACED` accents, `#f3f4fb` text, `#7d839a` muted.

## Common snags

- **Mailpit container won't start** → check Docker is running. `docker ps` should show the engine. macOS: open Docker Desktop.
- **Magic link arrives in console even though mailpit is up** → confirm `SMTP_URL=smtp://localhost:1025` is in `apps/server/.env` and the server has been restarted to pick it up.
- **Resend "domain not verified"** → run `dig` or use mxtoolbox to confirm SPF/DKIM/DMARC records actually published. Cloudflare's DNS UI sometimes caches incorrectly.
- **Workers SMTP failure in prod** → expected. Workers don't speak SMTP cleanly. Use Resend in prod, full stop.
