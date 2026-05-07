import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@howlcast/api/context";
import { fanOutDiscord } from "@howlcast/api/lib/discord";
import { refreshEmotes } from "@howlcast/api/lib/emotes";
import { verifyStreamWebhook } from "@howlcast/api/lib/stream";
import { appRouter } from "@howlcast/api/routers/index";
import { createAuth } from "@howlcast/auth";
import { createDb } from "@howlcast/db";
import { channelConfig, profiles, streamSessions } from "@howlcast/db/schema";
import { env } from "@howlcast/env/server";
import { desc, eq, isNull } from "drizzle-orm";
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
app.post("/api/webhooks/getstream", async (c) => {
	const sig = c.req.header("x-signature") ?? "";
	const raw = await c.req.text();

	let event: { type?: string; call_cid?: string };
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

	// Acknowledge all events we don't act on (e.g. chat message.new) without
	// HMAC verification — Chat and Video may use different signing schemes.
	// HMAC is only enforced for events that trigger DB writes or Discord fanout.
	if (!isLiveEvent && !isEndEvent) return c.json({ ok: true });

	const ok = await verifyStreamWebhook(raw, sig, env.STREAM_API_SECRET);
	if (!ok) return c.json({ error: "invalid signature" }, 401);

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
		await db.insert(streamSessions).values({
			id: crypto.randomUUID(),
			callId,
			startedAt: now,
		});
	} else {
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
		}
	}

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
// handler for crons — wrap both in a module-style export. The cron is bound
// in alchemy.run.ts as `0 */12 * * *` (twice daily emote refresh).
export default {
	fetch: app.fetch,
	async scheduled(_controller: ScheduledController, _env: Env, ctx: ExecutionContext) {
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
	},
};
