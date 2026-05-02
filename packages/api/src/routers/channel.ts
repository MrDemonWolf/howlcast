// Channel-info procedures. The channel page reads these to render the
// streamer header, panels grid, and visibility/mode pill. Single-tenant —
// channelConfig has exactly one row, id="site".

import { createDb } from "@howlcast/db";
import { channelConfig, panels, profiles } from "@howlcast/db/schema";
import { asc, eq } from "drizzle-orm";

import { publicProcedure, router } from "../index";

const SITE_ID = "site";

export const channelRouter = router({
	// Header strip data: stream title, visibility, broadcaster identity.
	// Returns null shape if the install hasn't run setup yet — caller can
	// branch on `setupCompleted` to redirect to /setup (Phase 6).
	getInfo: publicProcedure.query(async () => {
		const db = createDb();
		const cfg = await db.select().from(channelConfig).where(eq(channelConfig.id, SITE_ID)).get();

		if (!cfg) {
			return {
				setupCompleted: false,
				title: null,
				visibility: "public" as const,
				matureContent: false,
				broadcaster: null,
				isLive: false,
				liveStartedAt: null as number | null,
			};
		}

		const broadcaster = await db
			.select()
			.from(profiles)
			.where(eq(profiles.userId, cfg.ownerId))
			.get();

		const startedAt = cfg.liveStartedAt ?? null;
		const endedAt = cfg.liveEndedAt ?? null;
		const isLive = !!startedAt && (!endedAt || endedAt < startedAt);

		return {
			setupCompleted: !!cfg.setupCompletedAt,
			title: cfg.title,
			visibility: cfg.visibility,
			matureContent: cfg.matureContent,
			broadcaster: broadcaster
				? {
						userId: broadcaster.userId,
						displayName: broadcaster.displayName,
						bio: broadcaster.bio,
						avatarKey: broadcaster.avatarKey,
						verified: broadcaster.verified,
					}
				: null,
			isLive,
			liveStartedAt: startedAt ? startedAt.getTime() : null,
		};
	}),

	// Panels grid below the player. Sorted by `position`; empty list is fine.
	getPanels: publicProcedure.query(async () => {
		const db = createDb();
		const rows = await db.select().from(panels).orderBy(asc(panels.position)).all();
		return rows.map((p) => ({
			id: p.id,
			position: p.position,
			title: p.title,
			body: p.body,
			imageKey: p.imageKey,
			linkUrl: p.linkUrl,
		}));
	}),
});
