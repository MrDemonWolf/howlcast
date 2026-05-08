import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@howlcast/api/context";
import { fanOutDiscord } from "@howlcast/api/lib/discord";
import { refreshEmotes } from "@howlcast/api/lib/emotes";
import { verifyStreamWebhook } from "@howlcast/api/lib/stream";
import { enforceThrottle } from "@howlcast/api/lib/throttle";
import { appRouter } from "@howlcast/api/routers/index";
import { createAuth } from "@howlcast/auth";
import { createDb } from "@howlcast/db";
import {
	channelConfig,
	profiles,
	streamChatMinutes,
	streamSessions,
	streamViewerSnapshots,
} from "@howlcast/db/schema";
import { env } from "@howlcast/env/server";
import { desc, eq, isNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => createAuth().handler(c.req.raw));

app.use(
	"/api/trpc/*",
	trpcServer({
		router: appRouter,
		endpoint: "/api/trpc",
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.get("/api/health", (c) => c.json({ ok: true }));

// Branding logo upload (broadcaster only). Multipart POST → R2.
// Bypassing tRPC for this one route so the SDK can stream the body straight
// to R2 without buffering. Returns the new key + public URL.
const ALLOWED_LOGO_TYPES = new Map([
	["image/svg+xml", "svg"],
	["image/png", "png"],
	["image/jpeg", "jpg"],
]);
const MAX_LOGO_BYTES = 1_000_000;

app.post("/api/upload/logo", async (c) => {
	const auth = createAuth();
	const sess = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!sess?.user) return c.json({ error: "unauthenticated" }, 401);

	const db = createDb();
	const cfg = await db.select().from(channelConfig).where(eq(channelConfig.id, "site")).get();
	if (!cfg || cfg.ownerId !== sess.user.id) {
		return c.json({ error: "broadcaster only" }, 403);
	}

	// 5/hour cap. R2 + D1 writes per call; cheap to abuse otherwise.
	try {
		await enforceThrottle({
			kv: env.EMOTES_KV,
			key: `branding:upload:${sess.user.id}`,
			limit: 5,
			windowSec: 3600,
		});
	} catch {
		return c.json({ error: "rate limit" }, 429);
	}

	const form = await c.req.formData();
	const raw = form.get("file");
	// Hono types FormDataEntryValue as `string | Blob | null` in some
	// configs; the file we expect is a Blob (File extends Blob in Workers).
	if (!raw || typeof raw === "string") return c.json({ error: "missing file" }, 400);
	const file = raw as Blob & { type: string; size: number; name?: string };

	const ext = ALLOWED_LOGO_TYPES.get(file.type);
	if (!ext) return c.json({ error: "unsupported type" }, 415);
	if (file.size > MAX_LOGO_BYTES) return c.json({ error: "file too large" }, 413);

	const bytes = new Uint8Array(await file.arrayBuffer());
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	const hash = Array.from(new Uint8Array(digest))
		.slice(0, 8)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	const key = `branding/logo-${hash}.${ext}`;

	await env.PUBLIC_BUCKET.put(key, bytes, {
		httpMetadata: { contentType: file.type },
	});

	const { whiteLabel } = await import("@howlcast/db/schema");
	const existing = await db.select().from(whiteLabel).where(eq(whiteLabel.id, "site")).get();
	if (existing) {
		await db.update(whiteLabel).set({ customLogoKey: key }).where(eq(whiteLabel.id, "site"));
	} else {
		await db.insert(whiteLabel).values({ id: "site", customLogoKey: key });
	}

	return c.json({ key });
});

// GetStream webhook receiver. GetStream signs Video webhooks with the app's
// API Secret (no separate webhook secret) — verified via X-SIGNATURE header.
// Updates channelConfig.liveStartedAt/liveEndedAt on call.live_started /
// call.session_ended / call.ended. Discord fanout runs after the DB write.
//
// Phase 6 own-analytics: also handles call.session_participant_joined/_left
// for viewer counts + chat message.new for chat counts. Snapshots written to
// stream_viewer_snapshots; chat per-minute bucketed into stream_chat_minutes.
//
// Trust model:
//   - Video events (call.*) are HMAC-verified against STREAM_API_SECRET.
//   - Chat events (message.new) come from GetStream Chat which uses a
//     different signing scheme. We currently treat the URL secrecy as the
//     trust boundary for chat. TODO: research and verify chat HMAC.
const VIDEO_ACK_ONLY_EVENTS = new Set([
	"call.member_added",
	"call.member_removed",
	"call.member_updated",
	"call.updated",
	"call.permission_request",
	"call.recording_started",
	"call.recording_stopped",
]);
const CHAT_ACK_ONLY_EVENTS = new Set([
	"message.updated",
	"message.deleted",
	"user.banned",
	"user.unbanned",
]);

const KV_CURRENT_SESSION = "analytics:current_session_id";
const kvViewersKey = (sessionId: string) => `analytics:viewers:${sessionId}`;

type GetStreamWebhookEvent = {
	type?: string;
	call_cid?: string;
	participant?: { user?: { id?: string } };
	user?: { id?: string };
};

app.post("/api/webhooks/getstream", async (c) => {
	const sig = c.req.header("x-signature") ?? "";
	const raw = await c.req.text();

	let event: GetStreamWebhookEvent;
	try {
		event = JSON.parse(raw);
	} catch {
		return c.json({ error: "bad json" }, 400);
	}

	// GetStream's RTMPS pushes can fire `call.session_started` instead of
	// `call.live_started` depending on call config (backstage on/off,
	// auto-go-live setting, etc.). Treat both as "we're live now".
	const isLiveEvent = event.type === "call.live_started" || event.type === "call.session_started";
	const isEndEvent = event.type === "call.session_ended" || event.type === "call.ended";
	const isJoined = event.type === "call.session_participant_joined";
	const isLeft = event.type === "call.session_participant_left";
	const isChatMessage = event.type === "message.new";

	const isVideoEvent = isLiveEvent || isEndEvent || isJoined || isLeft;

	// Ack-only events: events we receive but don't act on. Reject anything
	// outside the explicit allowlist so we don't become an open ping endpoint.
	if (!isVideoEvent && !isChatMessage) {
		if (
			event.type &&
			(VIDEO_ACK_ONLY_EVENTS.has(event.type) || CHAT_ACK_ONLY_EVENTS.has(event.type))
		) {
			return c.json({ ok: true });
		}
		return c.json({ error: "unknown event type" }, 400);
	}

	// HMAC enforced for Video events only — see trust-model note above.
	if (isVideoEvent) {
		const ok = await verifyStreamWebhook(raw, sig, env.STREAM_API_SECRET);
		if (!ok) return c.json({ error: "invalid signature" }, 401);
	}

	const db = createDb();
	const now = new Date();

	if (isLiveEvent) {
		await db
			.update(channelConfig)
			.set({ liveStartedAt: now, liveEndedAt: null })
			.where(eq(channelConfig.id, "site"));
		// Open a new stream session row. callId is best-effort — the cid format
		// is "type:id"; we only care about the id half for stats.
		const callId = event.call_cid?.split(":")[1] ?? null;
		const sessionId = crypto.randomUUID();
		await db.insert(streamSessions).values({ id: sessionId, callId, startedAt: now });
		// Seed analytics KV. Subsequent join/leave events bump the counter,
		// minute cron reads it for periodic snapshots, chat events route to
		// this session id.
		await env.EMOTES_KV.put(KV_CURRENT_SESSION, sessionId);
		await env.EMOTES_KV.put(kvViewersKey(sessionId), "0");
	} else if (isEndEvent) {
		await db.update(channelConfig).set({ liveEndedAt: now }).where(eq(channelConfig.id, "site"));
		// Close the most recent open session (endedAt IS NULL). Compute total
		// minutes from startedAt → now. If no open row exists (e.g. a duplicate
		// session_ended fires after call.ended), this is a no-op.
		const open = await db
			.select()
			.from(streamSessions)
			.where(isNull(streamSessions.endedAt))
			.orderBy(desc(streamSessions.startedAt))
			.limit(1)
			.get();
		if (open) {
			const minutes = Math.max(0, Math.round((now.getTime() - open.startedAt.getTime()) / 60_000));
			await db
				.update(streamSessions)
				.set({ endedAt: now, totalMinutes: minutes })
				.where(eq(streamSessions.id, open.id));
			await env.EMOTES_KV.delete(kvViewersKey(open.id));
		}
		await env.EMOTES_KV.delete(KV_CURRENT_SESSION);
	} else if (isJoined || isLeft) {
		// Resolve current session + skip broadcaster.
		const sessionId = await env.EMOTES_KV.get(KV_CURRENT_SESSION);
		if (!sessionId) return c.json({ ok: true });
		const cfg = await db.select().from(channelConfig).where(eq(channelConfig.id, "site")).get();
		const participantId = event.participant?.user?.id ?? event.user?.id ?? null;
		if (cfg && participantId && participantId === cfg.ownerId) {
			return c.json({ ok: true });
		}
		// Read-modify-write the KV counter. Single-broadcaster scale, no CAS
		// needed — webhook fan-in is sequential per call.
		const cur = Number((await env.EMOTES_KV.get(kvViewersKey(sessionId))) ?? "0");
		const next = isJoined ? cur + 1 : Math.max(0, cur - 1);
		await env.EMOTES_KV.put(kvViewersKey(sessionId), String(next));
		await db.insert(streamViewerSnapshots).values({
			id: crypto.randomUUID(),
			sessionId,
			sampledAt: now,
			viewerCount: next,
		});
		if (isJoined) {
			// Bump peakViewers if we just hit a new high.
			await db
				.update(streamSessions)
				.set({ peakViewers: next })
				.where(
					sql`${streamSessions.id} = ${sessionId} AND ${streamSessions.peakViewers} < ${next}`,
				);
		}
	} else if (isChatMessage) {
		const sessionId = await env.EMOTES_KV.get(KV_CURRENT_SESSION);
		if (!sessionId) return c.json({ ok: true });
		// Bump session-total + per-minute bucket. Bucket is millis floored to
		// the minute so the chart can render bars without re-bucketing.
		const minuteBucket = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
		await db
			.update(streamSessions)
			.set({ chatMessageCount: sql`${streamSessions.chatMessageCount} + 1` })
			.where(eq(streamSessions.id, sessionId));
		await db
			.insert(streamChatMinutes)
			.values({ sessionId, minuteBucketMs: minuteBucket, count: 1 })
			.onConflictDoUpdate({
				target: [streamChatMinutes.sessionId, streamChatMinutes.minuteBucketMs],
				set: { count: sql`${streamChatMinutes.count} + 1` },
			});
		return c.json({ ok: true });
	}

	if (!isLiveEvent && !isEndEvent) return c.json({ ok: true });

	// Discord fanout — best-effort, runs after the DB write so live state
	// is correct even if Discord is down. fanOutDiscord swallows errors.
	const cfg = await db.select().from(channelConfig).where(eq(channelConfig.id, "site")).get();
	const broadcaster = cfg
		? await db.select().from(profiles).where(eq(profiles.userId, cfg.ownerId)).get()
		: null;
	const channelUrl = env.BETTER_AUTH_URL.replace(/^https?:\/\/(api\.)?/, "https://").replace(
		/\/$/,
		"",
	);

	await fanOutDiscord(isLiveEvent ? "live" : "end", {
		displayName: broadcaster?.displayName ?? "HowlCast",
		avatarUrl: null,
		channelUrl,
		title: cfg?.title ?? null,
	});

	return c.json({ ok: true });
});

app.get("/", (c) => {
	return c.text("OK");
});

// Workers don't accept Hono as default export when we also need a `scheduled`
// handler for crons — wrap both in a module-style export. Two crons bound in
// alchemy.run.ts:
//   - "0 */12 * * *"  twice-daily emote refresh
//   - "* * * * *"     1-minute analytics sampler + 7-day snapshot prune
//
// Both crons hit the same handler; we dispatch on `controller.cron` (the
// Cloudflare-supplied schedule string).
const SNAPSHOT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export default {
	fetch: app.fetch,
	async scheduled(controller: ScheduledController, _env: Env, ctx: ExecutionContext) {
		const schedule = controller.cron;
		if (schedule === "0 */12 * * *") {
			ctx.waitUntil(
				(async () => {
					// Read the broadcaster's Twitch id from the DB so the setup wizard
					// can change it without an env redeploy. Fail-soft on every step.
					const cfg = await createDb()
						.select()
						.from(channelConfig)
						.where(eq(channelConfig.id, "site"))
						.get();
					await refreshEmotes(
						cfg?.broadcasterTwitchId ?? null,
						{
							TWITCH_CLIENT_ID: env.TWITCH_CLIENT_ID,
							TWITCH_CLIENT_SECRET: env.TWITCH_CLIENT_SECRET,
						},
						env.EMOTES_KV,
					).catch(() => {
						/* providers all failed — pipeline writes nothing this tick */
					});
				})(),
			);
			return;
		}

		// Per-minute analytics sampler. Writes a baseline snapshot if a session
		// is currently live (sparse join/leave sessions still get a flat series),
		// then prunes snapshots older than the retention window once per hour.
		ctx.waitUntil(
			(async () => {
				const sessionId = await env.EMOTES_KV.get(KV_CURRENT_SESSION);
				const db = createDb();
				const now = new Date();
				if (sessionId) {
					const cur = Number((await env.EMOTES_KV.get(kvViewersKey(sessionId))) ?? "0");
					await db.insert(streamViewerSnapshots).values({
						id: crypto.randomUUID(),
						sessionId,
						sampledAt: now,
						viewerCount: cur,
					});
				}
				if (now.getMinutes() === 0) {
					const cutoff = new Date(now.getTime() - SNAPSHOT_RETENTION_MS);
					await db
						.delete(streamViewerSnapshots)
						.where(sql`${streamViewerSnapshots.sampledAt} < ${cutoff}`);
				}
			})(),
		);
	},
};
