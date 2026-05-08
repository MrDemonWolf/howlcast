// tRPC procedures for GetStream. Read-heavy on the public side (isLive,
// getViewerToken). Mutations for go-live/stop-live land here too once the
// dashboard exists; for now the broadcaster path is just `getBroadcasterToken`.

import { createDb } from "@howlcast/db";
import {
	channelConfig,
	profiles,
	streamChatMinutes,
	streamSessions,
	streamViewerSnapshots,
} from "@howlcast/db/schema";
import { env } from "@howlcast/env/server";
import { TRPCError } from "@trpc/server";
import { asc, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../index";
import { assertBroadcaster } from "../lib/broadcaster-guard";
import { getSiteConfig, SITE_ID } from "../lib/site";
import {
	createCall,
	getCall,
	goLive,
	signAdminToken,
	signStreamUserToken,
	stopLive,
	StreamNotConfiguredError,
} from "../lib/stream";

async function loadConfig() {
	return getSiteConfig(createDb());
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
	// Signed-in broadcasters receive role:"broadcaster" so GetStream doesn't
	// reject the JWT as a role downgrade from their server-side user record.
	getViewerToken: publicProcedure.query(async ({ ctx }) => {
		if (!env.STREAM_API_KEY || !env.STREAM_API_SECRET) throw streamNotConfigured();

		const isGuest = !ctx.session?.user.id;
		const userId = ctx.session?.user.id ?? `guest-${crypto.randomUUID()}`;

		let streamRole: string;
		let callCids: string[] | undefined;
		if (isGuest) {
			streamRole = "anonymous";
			// Anonymous Video tokens MUST include `call_cids` — GetStream rejects
			// the WS handshake otherwise. Scope to the single livestream call.
			const cfg = await loadConfig();
			if (cfg?.streamCallId) callCids = [`livestream:${cfg.streamCallId}`];
		} else {
			// Check if the signed-in user is the broadcaster so we emit the correct
			// role — GetStream rejects a JWT with role:"user" when the server-side
			// user record already has role:"broadcaster".
			const db = ctx.db;
			const me = await db
				.select({ role: profiles.role })
				.from(profiles)
				.where(eq(profiles.userId, ctx.session!.user.id))
				.get();
			streamRole = me?.role === "broadcaster" ? "broadcaster" : "user";
		}

		try {
			const token = await signStreamUserToken(env.STREAM_API_SECRET, {
				user_id: userId,
				role: streamRole,
				...(callCids ? { call_cids: callCids } : {}),
			});
			return { apiKey: env.STREAM_API_KEY, token, userId, isGuest };
		} catch (e) {
			if (e instanceof StreamNotConfiguredError) throw streamNotConfigured();
			throw e;
		}
	}),

	// Broadcaster-only. Returns an admin-capable token plus the call/channel
	// identifiers needed to drive the OBS push and dashboard go-live UI.
	// Backfills `rtmpsUrl` from a fresh GetStream get-call if it's missing
	// (older provisions before the column existed).
	getBroadcasterToken: protectedProcedure.query(async ({ ctx }) => {
		if (!env.STREAM_API_KEY || !env.STREAM_API_SECRET) throw streamNotConfigured();

		const { cfg } = await assertBroadcaster(ctx.session.user.id);
		const db = ctx.db;
		const userToken = await signStreamUserToken(env.STREAM_API_SECRET, {
			user_id: ctx.session.user.id,
			role: "broadcaster",
		});
		const adminToken = await signAdminToken(env.STREAM_API_SECRET);

		// Backfill the canonical RTMPS URL on first read if a previous provision
		// didn't capture it. Best-effort — if GetStream is down we just return null.
		let rtmpsUrl = cfg?.rtmpsUrl ?? null;
		if (!rtmpsUrl && cfg?.streamCallId) {
			const callResp = await getCall(
				env.STREAM_API_KEY,
				env.STREAM_API_SECRET,
				cfg.streamCallId,
			).catch(() => null);
			rtmpsUrl = callResp?.call?.ingress?.rtmp?.address ?? null;
			if (rtmpsUrl) {
				await db.update(channelConfig).set({ rtmpsUrl }).where(eq(channelConfig.id, SITE_ID));
			}
		}

		return {
			apiKey: env.STREAM_API_KEY,
			userToken,
			adminToken,
			userId: ctx.session.user.id,
			callId: cfg?.streamCallId ?? null,
			channelCid: cfg?.chatChannelCid ?? null,
			rtmpsUrl,
		};
	}),

	// Broadcaster-only. Provisions the GetStream livestream call + chat
	// channel and persists their identifiers. Idempotent — calling again
	// returns the same callId/channelCid. Required before goLive runs.
	provision: protectedProcedure.mutation(async ({ ctx }) => {
		if (!env.STREAM_API_KEY || !env.STREAM_API_SECRET) throw streamNotConfigured();

		await assertBroadcaster(ctx.session.user.id);
		const db = ctx.db;

		// Use the broadcaster's user id as the call id — single tenant means
		// it's stable, and the matching chat channel cid is deterministic.
		const callId = ctx.session.user.id;
		const channelCid = `livestream:${callId}`;

		const callResp = await createCall(
			env.STREAM_API_KEY,
			env.STREAM_API_SECRET,
			callId,
			ctx.session.user.id,
		);
		// Pull the canonical RTMPS URL from the response so OBS gets the URL
		// GetStream actually expects (varies by region/tier).
		const rtmpsUrl = callResp?.call?.ingress?.rtmp?.address ?? null;

		await db
			.update(channelConfig)
			.set({ streamCallId: callId, chatChannelCid: channelCid, rtmpsUrl })
			.where(eq(channelConfig.id, SITE_ID));

		return { callId, channelCid, rtmpsUrl };
	}),

	// Broadcaster-only "Go Live" — flips GetStream to live mode + starts HLS
	// fallback. The webhook (call.live_started) is what flips
	// channelConfig.liveStartedAt; this just kicks the call into live.
	goLive: protectedProcedure.mutation(async ({ ctx }) => {
		if (!env.STREAM_API_KEY || !env.STREAM_API_SECRET) throw streamNotConfigured();

		const { cfg } = await assertBroadcaster(ctx.session.user.id);
		if (!cfg.streamCallId) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Run provision first to set up the GetStream call.",
			});
		}

		await goLive(env.STREAM_API_KEY, env.STREAM_API_SECRET, cfg.streamCallId);
		return { ok: true };
	}),

	// Broadcaster-only "Stop streaming". Webhook flips liveEndedAt.
	stopLive: protectedProcedure.mutation(async ({ ctx }) => {
		if (!env.STREAM_API_KEY || !env.STREAM_API_SECRET) throw streamNotConfigured();

		const { cfg } = await assertBroadcaster(ctx.session.user.id);
		if (!cfg.streamCallId) {
			throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No active call." });
		}

		await stopLive(env.STREAM_API_KEY, env.STREAM_API_SECRET, cfg.streamCallId);
		return { ok: true };
	}),

	// Broadcaster-only stats. Aggregates the last 7 days of stream_sessions
	// rows (written by the GetStream webhook on call.live_started /
	// call.session_ended). Returns 3 top-line numbers + the session list.
	getStats: protectedProcedure.query(async ({ ctx }) => {
		await assertBroadcaster(ctx.session.user.id);
		const db = ctx.db;

		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const rows = await db
			.select()
			.from(streamSessions)
			.where(gte(streamSessions.startedAt, sevenDaysAgo))
			.orderBy(desc(streamSessions.startedAt))
			.all();

		const totalMinutesLast7d = rows.reduce((sum, r) => sum + (r.totalMinutes ?? 0), 0);
		const totalSessionsLast7d = rows.length;
		const totalChatMessagesLast7d = rows.reduce((sum, r) => sum + (r.chatMessageCount ?? 0), 0);

		// Streak: walk back from today; count consecutive days with at least one
		// session that started on that day. Day boundaries are local UTC.
		const sessionDays = new Set<string>();
		for (const r of rows) {
			sessionDays.add(r.startedAt.toISOString().slice(0, 10));
		}
		let currentStreak = 0;
		const cursor = new Date();
		for (let i = 0; i < 7; i++) {
			const key = cursor.toISOString().slice(0, 10);
			if (sessionDays.has(key)) {
				currentStreak++;
				cursor.setUTCDate(cursor.getUTCDate() - 1);
			} else if (i === 0) {
				// no session today — try yesterday but don't count today
				cursor.setUTCDate(cursor.getUTCDate() - 1);
			} else {
				break;
			}
		}

		// Look up the all-time first session for context (e.g. "streaming since…").
		const firstEver = await db
			.select({ startedAt: streamSessions.startedAt })
			.from(streamSessions)
			.orderBy(streamSessions.startedAt)
			.limit(1)
			.get();

		return {
			totalMinutesLast7d,
			totalSessionsLast7d,
			totalChatMessagesLast7d,
			currentStreak,
			firstSessionAt: firstEver?.startedAt?.getTime() ?? null,
			sessions: rows.map((r) => ({
				id: r.id,
				startedAt: r.startedAt.getTime(),
				endedAt: r.endedAt?.getTime() ?? null,
				totalMinutes: r.totalMinutes ?? 0,
				peakViewers: r.peakViewers ?? 0,
				chatMessageCount: r.chatMessageCount ?? 0,
			})),
		};
	}),

	// Per-session detail. Powers /dashboard/stats/[id] — header + viewer
	// snapshot line + chat-msgs-per-minute bar chart.
	getSessionDetail: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			await assertBroadcaster(ctx.session.user.id);
			const db = ctx.db;

			const session = await db
				.select()
				.from(streamSessions)
				.where(eq(streamSessions.id, input.id))
				.get();
			if (!session) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Session not found." });
			}

			const snapshots = await db
				.select({
					sampledAt: streamViewerSnapshots.sampledAt,
					viewerCount: streamViewerSnapshots.viewerCount,
				})
				.from(streamViewerSnapshots)
				.where(eq(streamViewerSnapshots.sessionId, input.id))
				.orderBy(asc(streamViewerSnapshots.sampledAt))
				.all();

			const minutes = await db
				.select({
					minuteBucketMs: streamChatMinutes.minuteBucketMs,
					count: streamChatMinutes.count,
				})
				.from(streamChatMinutes)
				.where(eq(streamChatMinutes.sessionId, input.id))
				.orderBy(asc(streamChatMinutes.minuteBucketMs))
				.all();

			return {
				session: {
					id: session.id,
					callId: session.callId,
					startedAt: session.startedAt.getTime(),
					endedAt: session.endedAt?.getTime() ?? null,
					peakViewers: session.peakViewers ?? 0,
					chatMessageCount: session.chatMessageCount ?? 0,
					totalMinutes: session.totalMinutes ?? 0,
				},
				viewerSnapshots: snapshots.map((s) => ({
					sampledAt: s.sampledAt.getTime(),
					viewerCount: s.viewerCount,
				})),
				chatMinutes: minutes.map((m) => ({
					minuteBucketMs: m.minuteBucketMs.getTime(),
					count: m.count,
				})),
			};
		}),
});
