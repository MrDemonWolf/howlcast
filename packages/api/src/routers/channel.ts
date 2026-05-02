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
import { createCall } from "../lib/stream";

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

	// Broadcaster-only. Provisions the GetStream livestream call + chat
	// channel and persists their identifiers on channelConfig. Idempotent —
	// safe to call again to refresh metadata. The channel page mounts the
	// real chat once `chatChannelCid` is set.
	createCall: protectedProcedure.mutation(async ({ ctx }) => {
		if (!env.STREAM_API_KEY || !env.STREAM_API_SECRET) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Stream not configured. Set STREAM_API_KEY and STREAM_API_SECRET to enable.",
			});
		}

		const db = createDb();
		const cfg = await db.select().from(channelConfig).where(eq(channelConfig.id, SITE_ID)).get();
		if (!cfg) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Channel not initialized. Run setup first.",
			});
		}
		if (ctx.session.user.id !== cfg.ownerId) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Broadcaster only." });
		}

		// Use the broadcaster id as the call id — single tenant, deterministic,
		// and lets `livestream:<id>` be the matching chat channel cid.
		const callId = cfg.ownerId;
		await createCall(env.STREAM_API_KEY, env.STREAM_API_SECRET, callId, cfg.ownerId);

		const channelCid = `livestream:${callId}`;
		await db
			.update(channelConfig)
			.set({ streamCallId: callId, chatChannelCid: channelCid })
			.where(eq(channelConfig.id, SITE_ID));

		return { callId, channelCid };
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
});
