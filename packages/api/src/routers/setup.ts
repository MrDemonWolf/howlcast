// First-run setup wizard. Three procedures:
//   - getStatus (public): tells the middleware/page whether setup ran
//   - lookup (public, idempotent): resolves Twitch username + probes 7TV /
//     BTTV / FFZ. No DB writes; safe to retry.
//   - commit (public, locked): creates the broadcaster account, profile,
//     and channelConfig in one transaction. Refuses if setupCompletedAt
//     is already set so a stale tab can't double-run.
//
// Public on purpose — first-run users don't have a session yet. The
// commit step issues the auth cookie via better-auth's signUpEmail so
// the wizard can land on /dashboard signed in.

import { createAuth } from "@howlcast/auth";
import { createDb } from "@howlcast/db";
import { channelConfig, profiles } from "@howlcast/db/schema";
import { env } from "@howlcast/env/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import {
	lookupTwitchUser,
	probeEmoteProviders,
	type ProviderProbe,
	TwitchNotConfiguredError,
} from "../lib/twitch";

const SITE_ID = "site";

async function siteRow() {
	const db = createDb();
	return db.select().from(channelConfig).where(eq(channelConfig.id, SITE_ID)).get();
}

async function assertNotCompleted() {
	const cfg = await siteRow();
	if (cfg?.setupCompletedAt) {
		throw new TRPCError({
			code: "CONFLICT",
			message: "Setup already completed.",
		});
	}
	return cfg;
}

export const setupRouter = router({
	getStatus: publicProcedure.query(async () => {
		const cfg = await siteRow();
		return { setupCompleted: !!cfg?.setupCompletedAt };
	}),

	// Step 1: resolve Twitch username + probe emote providers. No writes.
	lookup: publicProcedure
		.input(z.object({ username: z.string().min(1).max(25) }))
		.mutation(async ({ input }) => {
			await assertNotCompleted();
			try {
				const user = await lookupTwitchUser(input.username, env.EMOTES_KV, {
					clientId: env.TWITCH_CLIENT_ID,
					clientSecret: env.TWITCH_CLIENT_SECRET,
				});
				if (!user) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `No Twitch user with login "${input.username}".`,
					});
				}
				const providers: ProviderProbe = await probeEmoteProviders(user.id);
				return { user, providers };
			} catch (e) {
				if (e instanceof TwitchNotConfiguredError) {
					throw new TRPCError({ code: "PRECONDITION_FAILED", message: e.message });
				}
				throw e;
			}
		}),

	// Step 2/3 — atomic first-run commit. Creates the broadcaster account
	// (better-auth signUpEmail returns the session cookie via ctx headers),
	// then writes profiles + channelConfig. Refuses on second run.
	commit: publicProcedure
		.input(
			z.object({
				email: z.string().email(),
				password: z.string().min(8).max(128),
				twitchId: z.string().min(1),
				login: z.string().min(1),
				displayName: z.string().min(1).max(40),
				bio: z.string().max(500).nullable(),
				avatarUrl: z.string().url().nullable(),
				visibility: z.enum(["public", "invite_only"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const cfg = await assertNotCompleted();

			const auth = createAuth();
			const result = await auth.api.signUpEmail({
				body: {
					name: input.displayName,
					email: input.email,
					password: input.password,
					image: input.avatarUrl ?? undefined,
				},
				headers: ctx.headers,
				returnHeaders: true,
			});

			const userId = result.response?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Auth signup did not return a user id.",
				});
			}

			const db = createDb();
			const now = new Date();

			await db
				.insert(profiles)
				.values({
					userId,
					displayName: input.displayName,
					bio: input.bio,
					role: "broadcaster",
					verified: true,
					isInvited: true,
					invitedAt: now,
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: profiles.userId,
					set: {
						displayName: input.displayName,
						bio: input.bio,
						role: "broadcaster",
						verified: true,
						isInvited: true,
						updatedAt: now,
					},
				});

			if (cfg) {
				await db
					.update(channelConfig)
					.set({
						ownerId: userId,
						visibility: input.visibility,
						broadcasterTwitchId: input.twitchId,
						setupCompletedAt: now,
						updatedAt: now,
					})
					.where(eq(channelConfig.id, SITE_ID));
			} else {
				await db.insert(channelConfig).values({
					id: SITE_ID,
					ownerId: userId,
					visibility: input.visibility,
					broadcasterTwitchId: input.twitchId,
					setupCompletedAt: now,
					updatedAt: now,
				});
			}

			// Forward better-auth's set-cookie headers to the client so the
			// wizard's redirect to /dashboard arrives signed-in. Workers'
			// Headers exposes getSetCookie at runtime but the lib types
			// vary, so call it dynamically with a fallback.
			const headers = result.headers as Headers & { getSetCookie?: () => string[] };
			const setCookies =
				typeof headers?.getSetCookie === "function"
					? headers.getSetCookie()
					: headers
						? [headers.get("set-cookie") ?? ""].filter(Boolean)
						: [];
			for (const cookie of setCookies) {
				ctx.hono.header("set-cookie", cookie, { append: true });
			}

			return { ok: true };
		}),
});
