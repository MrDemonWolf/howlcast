import { passkey } from "@better-auth/passkey";
// Force a type reference to @simplewebauthn/server so the inferred
// passkey-plugin types stay portable across packages.
import type {} from "@simplewebauthn/server";
import { createDb } from "@howlcast/db";
import * as schema from "@howlcast/db/schema/auth";
import { env } from "@howlcast/env/server";
import { sendMail } from "@howlcast/mail";
import { magicLinkEmail } from "@howlcast/mail/templates/magic-link";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins/magic-link";
import { twoFactor } from "better-auth/plugins/two-factor";
import { username } from "better-auth/plugins/username";

function getRpID(url: string): string | undefined {
	try {
		return new URL(url).hostname;
	} catch {
		return undefined;
	}
}

export function createAuth() {
	const db = createDb();

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "sqlite",
			schema,
		}),
		trustedOrigins: [
			env.CORS_ORIGIN,
			"https://tv.mrdemonwolf.com",
			"https://api.tv.mrdemonwolf.com",
			"https://tv.mrdemonwolf.workers.dev",
			"https://tv-api.mrdemonwolf.workers.dev",
			"https://howlcast.tv",
		],
		emailAndPassword: {
			enabled: true,
			minPasswordLength: 8,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "lax",
				secure: true,
				httpOnly: true,
			},
			// Cross-subdomain cookies on .tv.mrdemonwolf.com so the session
			// cookie set by api.tv.* is read by tv.* (web). Scoped tight to
			// tv.* — won't leak to other mrdemonwolf.com subdomains.
			crossSubDomainCookies: {
				enabled: true,
				domain: "tv.mrdemonwolf.com",
			},
		},
		plugins: [
			username({
				minUsernameLength: 3,
				maxUsernameLength: 24,
			}),
			twoFactor({
				issuer: "HowlCast",
			}),
			passkey({
				rpName: "HowlCast",
				rpID: getRpID(env.BETTER_AUTH_URL),
			}),
			magicLink({
				expiresIn: 15 * 60,
				async sendMagicLink({ email, url }) {
					const { subject, html, text } = magicLinkEmail({ magicUrl: url });
					await sendMail(
						{
							RESEND_API_KEY: env.RESEND_API_KEY || undefined,
							SMTP_URL: env.SMTP_URL || undefined,
							MAIL_FROM: env.MAIL_FROM || undefined,
						},
						{ to: email, subject, html, text },
					);
				},
			}),
		],
	});
}
