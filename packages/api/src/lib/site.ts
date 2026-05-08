// Single-tenant install: there's exactly one channelConfig row, id="site".
// Centralize the constant + the "fetch the row" helper so routers don't each
// inline the same select.

import { createDb } from "@howlcast/db";
import { channelConfig } from "@howlcast/db/schema";
import { eq } from "drizzle-orm";

export const SITE_ID = "site";

export type SiteConfigRow = typeof channelConfig.$inferSelect;

export async function getSiteConfig(
	db: ReturnType<typeof createDb>,
): Promise<SiteConfigRow | null> {
	const row = await db.select().from(channelConfig).where(eq(channelConfig.id, SITE_ID)).get();
	return row ?? null;
}
