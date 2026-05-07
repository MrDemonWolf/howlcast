// Shared broadcaster gate. Single-tenant install: there's exactly one
// broadcaster row and channelConfig.ownerId points at it.

import { createDb } from "@howlcast/db";
import { channelConfig } from "@howlcast/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

const SITE_ID = "site";

export async function assertBroadcaster(userId: string) {
	const db = createDb();
	const cfg = await db.select().from(channelConfig).where(eq(channelConfig.id, SITE_ID)).get();
	if (!cfg || cfg.ownerId !== userId) {
		throw new TRPCError({ code: "FORBIDDEN", message: "Broadcaster only." });
	}
	return cfg;
}
