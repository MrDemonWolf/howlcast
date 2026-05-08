import { createAuth } from "@howlcast/auth";
import { createDb } from "@howlcast/db";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await createAuth().api.getSession({
		headers: context.req.raw.headers,
	});
	return {
		session,
		// One drizzle instance per request — share it across procedures via
		// `ctx.db` instead of every router calling `createDb()` 1-3 times.
		db: createDb(),
		// Pass through request headers + response writer so procedures that
		// drive better-auth (signUpEmail / signIn) can forward the
		// resulting set-cookie to the client.
		headers: context.req.raw.headers,
		hono: context,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
