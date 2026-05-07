// Channel-info procedures. The channel page reads these to render the
// streamer header, panels grid, and visibility/mode pill. Single-tenant —
// channelConfig has exactly one row, id="site".

import { createDb } from "@howlcast/db";
import { channelConfig, panels, profiles } from "@howlcast/db/schema";
import { env } from "@howlcast/env/server";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import { readEmoteMap, refreshEmotes } from "../lib/emotes";

const SITE_ID = "site";

export const channelRouter = router({
	// Header strip data: stream title, visibility, broadcaster identity.
	// Returns null shape if the install hasn't run setup yet — caller can
	// branch on `setupCompleted` to redirect to /setup (Phase 6).
	getInfo: publicProcedure.query(async () => {
		const db = createDb();
		const cfg = await db.select().from(channelConfig).where(eq(channelConfig.id, SITE_ID)).get();

		if (!cfg) {
			return {
				setupCompleted: false,
				title: null,
				visibility: "public" as const,
				matureContent: false,
				broadcaster: null,
				isLive: false,
				liveStartedAt: null as number | null,
			};
		}

		const broadcaster = await db
			.select()
			.from(profiles)
			.where(eq(profiles.userId, cfg.ownerId))
			.get();

		const startedAt = cfg.liveStartedAt ?? null;
		const endedAt = cfg.liveEndedAt ?? null;
		const isLive = !!startedAt && (!endedAt || endedAt < startedAt);

		return {
			setupCompleted: !!cfg.setupCompletedAt,
			title: cfg.title,
			visibility: cfg.visibility,
			matureContent: cfg.matureContent,
			broadcaster: broadcaster
				? {
						userId: broadcaster.userId,
						displayName: broadcaster.displayName,
						bio: broadcaster.bio,
						avatarKey: broadcaster.avatarKey,
						verified: broadcaster.verified,
					}
				: null,
			isLive,
			liveStartedAt: startedAt ? startedAt.getTime() : null,
		};
	}),

	// Broadcaster-only. Updates the editable channel config fields (title,
	// visibility). Used by the dashboard Live → Stream page. Title is
	// nullable (clearing makes the player show "No stream title yet").
	updateConfig: protectedProcedure
		.input(
			z.object({
				title: z.string().max(140).nullable().optional(),
				visibility: z.enum(["public", "invite_only"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = createDb();
			const cfg = await db.select().from(channelConfig).where(eq(channelConfig.id, SITE_ID)).get();
			if (!cfg) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Channel not initialized." });
			}
			if (ctx.session.user.id !== cfg.ownerId) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Broadcaster only." });
			}
			const patch: Partial<{ title: string | null; visibility: "public" | "invite_only" }> = {};
			if (input.title !== undefined) patch.title = input.title;
			if (input.visibility !== undefined) patch.visibility = input.visibility;
			if (Object.keys(patch).length === 0) return { ok: true };
			await db.update(channelConfig).set(patch).where(eq(channelConfig.id, SITE_ID));
			return { ok: true };
		}),

	// Public emote map. Cached in KV; cron refreshes every 12h. Returns null
	// shape on first boot before the cron has run; client treats it as empty.
	getEmotes: publicProcedure.query(async () => {
		const map = await readEmoteMap(env.EMOTES_KV);
		return map ?? { updatedAt: 0, emotes: [] };
	}),

	// Manual refresh — for the dashboard's "Refresh emotes" button. Same
	// pipeline as the cron, just on demand.
	refreshEmotes: protectedProcedure.mutation(async ({ ctx }) => {
		const db = createDb();
		const cfg = await db.select().from(channelConfig).where(eq(channelConfig.id, SITE_ID)).get();
		if (!cfg || ctx.session.user.id !== cfg.ownerId) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Broadcaster only." });
		}
		const map = await refreshEmotes(
			cfg.broadcasterTwitchId ?? null,
			{
				TWITCH_CLIENT_ID: env.TWITCH_CLIENT_ID,
				TWITCH_CLIENT_SECRET: env.TWITCH_CLIENT_SECRET,
			},
			env.EMOTES_KV,
		);
		return { count: map.emotes.length, updatedAt: map.updatedAt };
	}),

	// Panels grid below the player. Sorted by `position`; empty list is fine.
	getPanels: publicProcedure.query(async () => {
		const db = createDb();
		const rows = await db.select().from(panels).orderBy(asc(panels.position)).all();
		return rows.map((p) => ({
			id: p.id,
			position: p.position,
			title: p.title,
			body: p.body,
			imageKey: p.imageKey,
			linkUrl: p.linkUrl,
		}));
	}),

	// Broadcaster-only. Create or update a panel. id is generated client-side
	// (crypto.randomUUID) for new panels so the optimistic insert works.
	upsertPanel: protectedProcedure
		.input(
			z.object({
				id: z.string().min(1),
				title: z.string().max(80).nullable(),
				body: z.string().max(2000).nullable(),
				imageKey: z.string().max(500).nullable(),
				linkUrl: z.string().url().max(500).nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await assertBroadcaster(ctx.session.user.id);
			const db = createDb();
			const existing = await db.select().from(panels).where(eq(panels.id, input.id)).get();
			if (existing) {
				await db
					.update(panels)
					.set({
						title: input.title,
						body: input.body,
						imageKey: input.imageKey,
						linkUrl: input.linkUrl,
					})
					.where(eq(panels.id, input.id));
				return { ok: true, created: false };
			}
			const max = await db
				.select()
				.from(panels)
				.orderBy(asc(panels.position))
				.all()
				.then((rs) => (rs[rs.length - 1]?.position ?? -1) + 1);
			await db.insert(panels).values({
				id: input.id,
				position: max,
				title: input.title,
				body: input.body,
				imageKey: input.imageKey,
				linkUrl: input.linkUrl,
			});
			return { ok: true, created: true };
		}),

	deletePanel: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			await assertBroadcaster(ctx.session.user.id);
			const db = createDb();
			await db.delete(panels).where(eq(panels.id, input.id));
			return { ok: true };
		}),

	// Re-orders all panels at once. Client sends the full id list in the
	// new order; server rewrites positions 0..n-1 in a single transaction.
	reorderPanels: protectedProcedure
		.input(z.object({ ids: z.array(z.string().min(1)) }))
		.mutation(async ({ ctx, input }) => {
			await assertBroadcaster(ctx.session.user.id);
			const db = createDb();
			for (let i = 0; i < input.ids.length; i++) {
				const id = input.ids[i];
				if (!id) continue;
				await db.update(panels).set({ position: i }).where(eq(panels.id, id));
			}
			return { ok: true };
		}),
});

async function assertBroadcaster(userId: string) {
	const db = createDb();
	const cfg = await db.select().from(channelConfig).where(eq(channelConfig.id, SITE_ID)).get();
	if (!cfg || cfg.ownerId !== userId) {
		throw new TRPCError({ code: "FORBIDDEN", message: "Broadcaster only." });
	}
}
