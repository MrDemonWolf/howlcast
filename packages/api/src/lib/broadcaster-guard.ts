// Shared broadcaster gate. Single-tenant install: there's exactly one
// broadcaster row and channelConfig.ownerId points at it. Returns both the
// site config and the broadcaster's profile so callers don't re-query.

import { createDb } from "@howlcast/db";
import { profiles } from "@howlcast/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { getSiteConfig, type SiteConfigRow } from "./site";

export type BroadcasterContext = {
	cfg: SiteConfigRow;
	profile: typeof profiles.$inferSelect;
};

export async function assertBroadcaster(userId: string): Promise<BroadcasterContext> {
	const db = createDb();
	const cfg = await getSiteConfig(db);
	if (!cfg || cfg.ownerId !== userId) {
		throw new TRPCError({ code: "FORBIDDEN", message: "Broadcaster only." });
	}
	const profile = await db.select().from(profiles).where(eq(profiles.userId, userId)).get();
	if (!profile || profile.role !== "broadcaster") {
		throw new TRPCError({ code: "FORBIDDEN", message: "Broadcaster only." });
	}
	return { cfg, profile };
}
