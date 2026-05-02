import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@howlcast/api/context";
import { appRouter } from "@howlcast/api/routers/index";
import { createAuth } from "@howlcast/auth";
import { env } from "@howlcast/env/server";
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

app.get("/", (c) => {
	return c.text("OK");
});

export default app;
