import { router } from "../index";
import { accountRouter } from "./account";
import { adminRouter } from "./admin";
import { brandingRouter } from "./branding";
import { channelRouter } from "./channel";
import { setupRouter } from "./setup";
import { streamRouter } from "./stream";

// Health check lives at /api/health on apps/server (HTTP) — no need for a
// tRPC clone. privateData was BTS scaffold; deleted with the rest of the
// "first procedure ever" placeholders.
export const appRouter = router({
	stream: streamRouter,
	channel: channelRouter,
	setup: setupRouter,
	admin: adminRouter,
	account: accountRouter,
	branding: brandingRouter,
});
export type AppRouter = typeof appRouter;
