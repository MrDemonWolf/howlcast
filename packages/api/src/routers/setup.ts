// First-run setup wizard. Two procedures: lookup (read-only Twitch +
// emote provider probe) and commit (writes profiles + channelConfig
// rows + flips setupCompletedAt). Single tenant — once completed, the
// wizard is locked. Phase 6 will add an "edit channel info" path for
// changes after setup.

import { createDb } from "@howlcast/db";
import { channelConfig, profiles } from "@howlcast/db/schema";
import { env } from "@howlcast/env/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import {
	lookupTwitchUser,
	probeEmoteProviders,
	type ProviderProbe,
	TwitchNotConfiguredError,
} from "../lib/twitch";

const SITE_ID = "site";

export const setupRouter = router({
	// Returns whether setup has run. Public so the middleware can hit it
	// without auth and decide whether to redirect to /setup.
	getStatus: publicProcedure.query(async () => {
		const db = createDb();
		const cfg = await db
			.select({ setupCompletedAt: channelConfig.setupCompletedAt })
			.from(channelConfig)
			.where(eq(channelConfig.id, SITE_ID))
			.get();
		return { setupCompleted: !!cfg?.setupCompletedAt };
	}),

	// Step 1: resolve a Twitch username to {id, displayName, avatar, bio}
	// + probe 7TV / BTTV / FFZ for emote counts. Read-only — no DB writes.
	lookup: protectedProcedure
		.input(z.object({ username: z.string().min(1).max(25) }))
		.mutation(async ({ input }) => {
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
					throw new TRPCError({
						code: "PRECONDITION_FAILED",
						message: e.message,
					});
				}
				throw e;
			}
		}),

	// Step 2: persist the resolved data. Idempotent guard — if setup has
	// already completed, refuses (Phase 6 will add an edit path). Writes
	// the broadcaster profile + the single-row channelConfig.
	commit: protectedProcedure
		.input(
			z.object({
				twitchId: z.string().min(1),
				login: z.string().min(1),
				displayName: z.string().min(1).max(40),
				bio: z.string().max(500).nullable(),
				avatarUrl: z.string().url().nullable(),
				visibility: z.enum(["public", "invite_only"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = createDb();

			const existing = await db
				.select()
				.from(channelConfig)
				.where(eq(channelConfig.id, SITE_ID))
				.get();
			if (existing?.setupCompletedAt) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Setup already completed.",
				});
			}

			const userId = ctx.session.user.id;
			const now = new Date();

			// profiles row — broadcaster identity. avatarUrl is intentionally
			// not persisted as R2 yet; Phase 6 wizard improvement downloads it
			// to R2 howlcast-public. For now we store the Twitch CDN URL in a
			// "profile_image_url"-shaped field via the bio (lossless compromise:
			// users see their Twitch avatar via existing avatar handling once
			// we wire it). For now bio carries it as a fallback only if no bio.
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

			// channelConfig — single row, id="site". Inserted on first run,
			// updated on retry (idempotent guard above blocks post-completion).
			if (existing) {
				await db
					.update(channelConfig)
					.set({
						ownerId: userId,
						title: null,
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

			return { ok: true };
		}),
});
