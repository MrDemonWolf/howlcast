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

// GetStream webhook receiver. GetStream signs Video webhooks with the app's
// API Secret (no separate webhook secret) — verified via X-SIGNATURE header.
// Updates channelConfig.liveStartedAt/liveEndedAt on call.live_started /
// call.session_ended / call.ended. Discord fanout runs after the DB write.
app.post("/api/webhooks/getstream", async (c) => {
	const sig = c.req.header("x-signature") ?? "";
	const raw = await c.req.text();

	const ok = await verifyStreamWebhook(raw, sig, env.STREAM_API_SECRET);
	if (!ok) return c.json({ error: "invalid signature" }, 401);

	let event: { type?: string; call_cid?: string };
	try {
		event = JSON.parse(raw);
	} catch {
		return c.json({ error: "bad json" }, 400);
	}

	const db = createDb();
	const now = new Date();

	// GetStream's RTMPS pushes can fire `call.session_started` instead of
	// `call.live_started` depending on call config (backstage on/off,
	// auto-go-live setting, etc.). Treat both as "we're live now".
	const isLiveEvent = event.type === "call.live_started" || event.type === "call.session_started";
	const isEndEvent = event.type === "call.session_ended" || event.type === "call.ended";

	if (!isLiveEvent && !isEndEvent) return c.json({ ok: true });

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
