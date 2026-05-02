// tRPC procedures for GetStream. Read-heavy on the public side (isLive,
// getViewerToken). Mutations for go-live/stop-live land here too once the
// dashboard exists; for now the broadcaster path is just `getBroadcasterToken`.

import { createDb } from "@howlcast/db";
import { channelConfig, profiles } from "@howlcast/db/schema";
import { env } from "@howlcast/env/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../index";
import {
	createCall,
	goLive,
	signAdminToken,
	signStreamUserToken,
	stopLive,
	StreamNotConfiguredError,
} from "../lib/stream";

const SITE_ID = "site";

async function loadConfig() {
	const db = createDb();
	const row = await db.select().from(channelConfig).where(eq(channelConfig.id, SITE_ID)).get();
	return row ?? null;
}

function streamNotConfigured(): TRPCError {
	return new TRPCError({
		code: "PRECONDITION_FAILED",
		message: "Stream not configured. Set STREAM_API_KEY and STREAM_API_SECRET to enable.",
	});
}

export const streamRouter = router({
	// Live status — cheap, polled by the channel page every ~10s until we wire
	// webhook-driven invalidation. No keys required: derived from DB columns.
	isLive: publicProcedure.query(async () => {
		const cfg = await loadConfig();
		const startedAt = cfg?.liveStartedAt ?? null;
		const endedAt = cfg?.liveEndedAt ?? null;
		const isLive = !!startedAt && (!endedAt || endedAt < startedAt);
		return {
			isLive,
			startedAt: startedAt ? startedAt.getTime() : null,
			endedAt: endedAt ? endedAt.getTime() : null,
		};
	}),

	// Public-facing call/channel identifiers + a snapshot of liveness.
	// Browser uses this to wire the Video and Chat clients.
	getStreamCredentials: publicProcedure.query(async () => {
		const cfg = await loadConfig();
		if (!cfg) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Channel not initialized. Run setup first.",
			});
		}
		const startedAt = cfg.liveStartedAt ?? null;
		const endedAt = cfg.liveEndedAt ?? null;
		return {
			apiKey: env.STREAM_API_KEY,
			callId: cfg.streamCallId,
			channelCid: cfg.chatChannelCid,
			isLive: !!startedAt && (!endedAt || endedAt < startedAt),
		};
	}),

	// Token for an anonymous or signed-in viewer. Anonymous viewers get a
	// stable but ephemeral guest id so the SDK has something to work with.
	getViewerToken: publicProcedure.query(async ({ ctx }) => {
		if (!env.STREAM_API_KEY || !env.STREAM_API_SECRET) throw streamNotConfigured();

		const userId = ctx.session?.user.id ?? `guest-${crypto.randomUUID()}`;
		try {
			const token = await signStreamUserToken(env.STREAM_API_SECRET, {
				user_id: userId,
				role: ctx.session?.user.id ? "user" : "anonymous",
			});
			return { apiKey: env.STREAM_API_KEY, token, userId };
		} catch (e) {
			if (e instanceof StreamNotConfiguredError) throw streamNotConfigured();
			throw e;
		}
	}),

	// Broadcaster-only. Returns an admin-capable token plus the call/channel
	// identifiers needed to drive the OBS push and dashboard go-live UI.
	getBroadcasterToken: protectedProcedure.query(async ({ ctx }) => {
		if (!env.STREAM_API_KEY || !env.STREAM_API_SECRET) throw streamNotConfigured();

		const db = createDb();
		const me = await db
			.select()
			.from(profiles)
			.where(eq(profiles.userId, ctx.session.user.id))
			.get();
		if (!me || me.role !== "broadcaster") {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Broadcaster role required.",
			});
		}

		const cfg = await loadConfig();
		const userToken = await signStreamUserToken(env.STREAM_API_SECRET, {
			user_id: ctx.session.user.id,
			role: "broadcaster",
		});
		const adminToken = await signAdminToken(env.STREAM_API_SECRET);
		return {
			apiKey: env.STREAM_API_KEY,
			userToken,
			adminToken,
			userId: ctx.session.user.id,
			callId: cfg?.streamCallId ?? null,
			channelCid: cfg?.chatChannelCid ?? null,
		};
	}),

	// Broadcaster-only. Provisions the GetStream livestream call + chat
	// channel and persists their identifiers. Idempotent — calling again
	// returns the same callId/channelCid. Required before goLive runs.
	provision: protectedProcedure.mutation(async ({ ctx }) => {
		if (!env.STREAM_API_KEY || !env.STREAM_API_SECRET) throw streamNotConfigured();

		const db = createDb();
		const cfg = await loadConfig();
		if (!cfg) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Channel not initialized." });
		}
		const me = await db
			.select()
			.from(profiles)
			.where(eq(profiles.userId, ctx.session.user.id))
			.get();
		if (!me || me.role !== "broadcaster") {
			throw new TRPCError({ code: "FORBIDDEN", message: "Broadcaster only." });
		}

		// Use the broadcaster's user id as the call id — single tenant means
		// it's stable, and the matching chat channel cid is deterministic.
		const callId = ctx.session.user.id;
		const channelCid = `livestream:${callId}`;

		await createCall(env.STREAM_API_KEY, env.STREAM_API_SECRET, callId, ctx.session.user.id);

		await db
			.update(channelConfig)
			.set({ streamCallId: callId, chatChannelCid: channelCid })
			.where(eq(channelConfig.id, SITE_ID));

		return { callId, channelCid };
	}),

	// Broadcaster-only "Go Live" — flips GetStream to live mode + starts HLS
	// fallback. The webhook (call.live_started) is what flips
	// channelConfig.liveStartedAt; this just kicks the call into live.
	goLive: protectedProcedure.mutation(async ({ ctx }) => {
		if (!env.STREAM_API_KEY || !env.STREAM_API_SECRET) throw streamNotConfigured();

		const cfg = await loadConfig();
		if (!cfg?.streamCallId) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Run provision first to set up the GetStream call.",
			});
		}
		if (ctx.session.user.id !== cfg.ownerId) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Broadcaster only." });
		}

		await goLive(env.STREAM_API_KEY, env.STREAM_API_SECRET, cfg.streamCallId);
		return { ok: true };
	}),

	// Broadcaster-only "Stop streaming". Webhook flips liveEndedAt.
	stopLive: protectedProcedure.mutation(async ({ ctx }) => {
		if (!env.STREAM_API_KEY || !env.STREAM_API_SECRET) throw streamNotConfigured();

		const cfg = await loadConfig();
		if (!cfg?.streamCallId) {
			throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No active call." });
		}
		if (ctx.session.user.id !== cfg.ownerId) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Broadcaster only." });
		}

		await stopLive(env.STREAM_API_KEY, env.STREAM_API_SECRET, cfg.streamCallId);
		return { ok: true };
	}),
});
