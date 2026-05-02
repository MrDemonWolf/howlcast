# Better Auth Integration

> **TL;DR:** Better Auth ≥1.6 with native D1 support. Per-request factory pattern (NOT module-scope). Plugins: `username`, `twoFactor`, `passkey` (via `@better-auth/passkey`), `magicLink`. Magic-link emails go through `@howlcast/mail` (Resend / SMTP / console). Auth lives at `packages/auth/src/index.ts`; client at `apps/web/src/lib/auth-client.ts`. Sign-in UI at `apps/web/src/components/auth/login-form.tsx`. Security center at `apps/web/src/app/account/security/page.tsx`.

For mail transport details see [`docs/integrations/mail.md`](./mail.md).

## What you'll find here

1. The critical pattern: per-request factory
2. Full auth config (the file you'll write)
3. Hono mount
4. Schema generation
5. Email provider (Resend)
6. Cross-subdomain cookies (the easy-to-miss block)
7. Gotchas

---

## The critical pattern

D1 bindings only exist inside `fetch()`. **Reusing a Better Auth instance across requests causes 33-second D1 hangs and 503 cascades.**

**ALWAYS do this:**

```ts
// apps/server/src/lib/auth.ts
import { betterAuth } from "better-auth";
import { username, twoFactor, magicLink } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";

export const createAuth = (env: Env) =>
	betterAuth({
		database: env.DB, // native D1 (Better Auth ≥1.5)
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		appName: "HowlCast",
		trustedOrigins: ["https://howlcast.tv"],

		advanced: {
			crossSubDomainCookies: {
				enabled: true,
				domain: ".howlcast.tv",
			},
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
				partitioned: true, // Safari ITP / Chrome CHIPS
			},
		},

		secondaryStorage: {
			get: (k) => env.KV.get(k),
			set: (k, v, ttl) => env.KV.put(k, v, ttl ? { expirationTtl: Math.max(ttl, 60) } : {}),
			delete: (k) => env.KV.delete(k),
		},

		emailAndPassword: { enabled: true },

		plugins: [
			username({
				minUsernameLength: 3,
				maxUsernameLength: 30,
			}),
			twoFactor({
				issuer: "HowlCast",
				allowPasswordless: true,
				totpOptions: { digits: 6, period: 30 },
			}),
			passkey({
				rpID: "howlcast.tv",
				rpName: "HowlCast",
				origin: "https://howlcast.tv",
			}),
			magicLink({
				expiresIn: 600, // 10 min
				allowedAttempts: 1,
				storeToken: "hashed",
				sendMagicLink: async ({ email, url }) => {
					const r = await fetch("https://api.resend.com/emails", {
						method: "POST",
						headers: {
							Authorization: `Bearer ${env.RESEND_API_KEY}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							from: "HowlCast <login@mail.howlcast.tv>",
							to: [email],
							subject: "Sign in to HowlCast",
							html: `
                <p>Click to sign in (expires in 10 minutes):</p>
                <p><a href="${url}">${url}</a></p>
                <p>If you didn't request this, ignore this email.</p>
              `,
						}),
					});
					if (!r.ok) {
						throw new Error(`Resend ${r.status}: ${await r.text()}`);
					}
				},
			}),
		],
	});
```

**Module-scope `betterAuth(...)` instances will break in production. Don't do it.**

---

## Hono mount

```ts
// apps/server/src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./lib/auth";

type Env = {
	Bindings: {
		DB: D1Database;
		KV: KVNamespace;
		BETTER_AUTH_SECRET: string;
		BETTER_AUTH_URL: string;
		CORS_ORIGIN: string;
		RESEND_API_KEY: string;
	};
	Variables: {
		auth: ReturnType<typeof createAuth>;
		user: any;
		session: any;
	};
};

const app = new Hono<Env>();

app.use(
	"*",
	cors({
		origin: (origin, c) => c.env.CORS_ORIGIN,
		credentials: true,
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
	}),
);

// Per-request auth factory
app.use("*", async (c, next) => {
	c.set("auth", createAuth(c.env));
	await next();
});

// Better Auth handler
app.on(["GET", "POST"], "/api/auth/*", (c) => c.get("auth").handler(c.req.raw));

// tRPC context with session
app.use("/trpc/*", async (c, next) => {
	const session = await c.get("auth").api.getSession({
		headers: c.req.raw.headers,
	});
	c.set("user", session?.user ?? null);
	c.set("session", session?.session ?? null);
	await next();
});

// Mount tRPC server here...

export default app;
```

---

## Client setup

```ts
// apps/web/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import {
	usernameClient,
	twoFactorClient,
	magicLinkClient,
	passkeyClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_SERVER_URL!, // https://api.howlcast.tv
	plugins: [usernameClient(), twoFactorClient(), magicLinkClient(), passkeyClient()],
	fetchOptions: {
		credentials: "include", // important for cross-subdomain cookies
	},
});
```

Mirror plugins on client and server. If they don't match, you get cryptic runtime errors.

---

## Schema generation

```bash
# Generate Drizzle schema for auth tables (and all enabled plugins)
pnpm --filter server auth:generate

# Generate Drizzle migration
pnpm --filter server db:generate

# Apply locally
wrangler d1 migrations apply howlcast-db --local

# Apply to production
wrangler d1 migrations apply howlcast-db --remote
```

Run `auth:generate` again any time you add or remove plugins.

---

## Email provider: Resend

Final answer is **Resend**. Comparison summary:

| Provider     | Free tier              | Workers ease                  | Notes                                     |
| ------------ | ---------------------- | ----------------------------- | ----------------------------------------- |
| **Resend**   | **3k/mo, 100/day**     | Trivial; CF official tutorial | **Pick this**                             |
| Postmark     | 100/mo (test)          | Trivial                       | Best deliverability if you outgrow Resend |
| Amazon SES   | 3k/mo for 12 mo only   | Medium (SigV4)                | Cheapest at scale                         |
| MailChannels | **DEAD for free CF**   | n/a                           | Sunset Aug 2024 — DO NOT use              |
| SendGrid     | None (killed May 2025) | Trivial                       | Skip                                      |

**Setup:**

- [ ] Sign up at resend.com
- [ ] Verify your domain (`mail.howlcast.tv` recommended subdomain)
- [ ] Set up SPF, DKIM, DMARC records as Resend instructs
- [ ] Create an API key, scope to "Sending access" only
- [ ] Add `RESEND_API_KEY` as a Worker secret
- [ ] Test: send a magic link to your own email

For 100–1000 magic-link emails/month, you'll never pay anything.

---

## Cross-subdomain cookies (don't forget)

Because we run web on `howlcast.tv` and server on `api.howlcast.tv`, cookies need help to flow between them.

The `advanced` block in `createAuth` (above) handles this. **The two critical bits:**

1. `crossSubDomainCookies.domain: ".howlcast.tv"` (note the leading dot)
2. `defaultCookieAttributes.partitioned: true` (for Safari ITP)

**Test on Safari early.** If auth works in Chrome but breaks in Safari, it's almost always a cookie-attribute problem.

---

## Gotchas

- **Better Auth 1.4.x had `trustedOrigins` regressions on Hono+Workers.** Pin ≥ 1.5.
- **Module-scope auth instance = production hangs.** Per-request factory only.
- **Passkey RP ID can't be `*.workers.dev`.** Public suffix list rejects it. You need your custom domain configured before passkeys work.
- **The CLI binary changed.** Old `@better-auth/cli`, new standalone `npx auth` in Better Auth 1.5+. If `pnpm auth:generate` errors, swap script to use the new binary.
- **Plugin parity matters.** Server plugins and client plugins must match exactly. Mismatched plugins cause runtime errors with no clear stack trace.
- **`drizzle-kit migrate` does NOT work against D1.** Use `wrangler d1 migrations apply`. BTS scripts this correctly; don't accidentally swap it.
- **Magic link tokens should be `storeToken: "hashed"`.** Not plaintext. Old tutorials may show plaintext.
- **`partitioned: true` on cookies is non-negotiable.** Safari and Chrome enforce CHIPS in 2026.

---

## Testing checklist

When auth is "done":

- [ ] Sign up with email + password works
- [ ] Sign in with username + password works
- [ ] Magic link arrives, clicking it logs you in
- [ ] Passkey enroll on your real domain (NOT `*.workers.dev`) works
- [ ] Passkey login works
- [ ] 2FA enroll shows QR, app reads it, code verifies
- [ ] 2FA prompts on next login
- [ ] Sessions persist across page reloads
- [ ] Sessions persist across subdomains (web → API requests authenticated)
- [ ] Logout clears session
- [ ] Test on Safari (real device or simulator)
- [ ] Test on iOS (real device)
