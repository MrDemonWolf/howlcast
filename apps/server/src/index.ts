import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@howlcast/api/context";
import { fanOutDiscord } from "@howlcast/api/lib/discord";
import { verifyStreamWebhook } from "@howlcast/api/lib/stream";
import { appRouter } from "@howlcast/api/routers/index";
import { createAuth } from "@howlcast/auth";
import { createDb } from "@howlcast/db";
import { channelConfig, profiles } from "@howlcast/db/schema";
import { env } from "@howlcast/env/server";
import { eq } from "drizzle-orm";
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

// GetStream webhook receiver. HMAC-verified against STREAM_WEBHOOK_SECRET.
// Updates channelConfig.liveStartedAt/liveEndedAt on call.live_started /
// call.session_ended / call.ended. Discord fanout is Stage 3D.
app.post("/api/webhooks/getstream", async (c) => {
	const sig = c.req.header("x-signature") ?? "";
	const raw = await c.req.text();

	const ok = await verifyStreamWebhook(raw, sig, env.STREAM_WEBHOOK_SECRET);
	if (!ok) return c.json({ error: "invalid signature" }, 401);

	let event: { type?: string; call_cid?: string };
	try {
		event = JSON.parse(raw);
	} catch {
		return c.json({ error: "bad json" }, 400);
	}

	const db = createDb();
	const now = new Date();

	const isLiveEvent = event.type === "call.live_started";
	const isEndEvent =
		event.type === "call.session_ended" || event.type === "call.ended";

	if (!isLiveEvent && !isEndEvent) return c.json({ ok: true });

	if (isLiveEvent) {
		await db
			.update(channelConfig)
			.set({ liveStartedAt: now, liveEndedAt: null })
			.where(eq(channelConfig.id, "site"));
	} else {
		await db
			.update(channelConfig)
			.set({ liveEndedAt: now })
			.where(eq(channelConfig.id, "site"));
	}

	// Discord fanout — best-effort, runs after the DB write so live state
	// is correct even if Discord is down. fanOutDiscord swallows errors.
	const cfg = await db
		.select()
		.from(channelConfig)
		.where(eq(channelConfig.id, "site"))
		.get();
	const broadcaster = cfg
		? await db
				.select()
				.from(profiles)
				.where(eq(profiles.userId, cfg.ownerId))
				.get()
		: null;
	const channelUrl = env.BETTER_AUTH_URL.replace(
		/^https?:\/\/(api\.)?/,
		"https://",
	).replace(/\/$/, "");

	await fanOutDiscord(isLiveEvent ? "live" : "end", {
		displayName: broadcaster?.displayName ?? "MrDemonWolf",
		avatarUrl: null,
		channelUrl,
		title: cfg?.title ?? null,
	});

	return c.json({ ok: true });
});

app.get("/", (c) => {
	return c.text("OK");
});

export default app;
