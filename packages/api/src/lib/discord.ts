// Discord webhook fanout. Two configured rows: id="public" and id="private".
// Configured from Dashboard → Channel → Notifications (Phase 5). Fired on
// stream.online (call.live_started) and stream.offline (call.session_ended).
//
// We respect per-row `notifyOnLive` / `notifyOnEnd` toggles; we record
// `lastFiredAt` on success and `lastError` on failure so the dashboard can
// surface broken webhooks.

import { createDb } from "@howlcast/db";
import { webhooks } from "@howlcast/db/schema";
import { eq } from "drizzle-orm";

type FanoutEvent = "live" | "end";

type EmbedInput = {
	displayName: string;
	avatarUrl?: string | null;
	channelUrl: string;
	title?: string | null;
};

const COLOR_LIVE = 0x0faced; // HowlCast cyan
const COLOR_END = 0x55667a; // muted slate

function buildEmbed(event: FanoutEvent, input: EmbedInput) {
	const isLive = event === "live";
	return {
		username: "HowlCast",
		embeds: [
			{
				title: isLive ? `${input.displayName} is LIVE` : `${input.displayName}'s stream ended`,
				description: isLive ? (input.title ?? "Tune in.") : null,
				url: isLive ? input.channelUrl : undefined,
				color: isLive ? COLOR_LIVE : COLOR_END,
				timestamp: new Date().toISOString(),
				thumbnail: input.avatarUrl ? { url: input.avatarUrl } : undefined,
			},
		],
	};
}

async function postOne(
	url: string,
	body: object,
): Promise<{ ok: true } | { ok: false; error: string }> {
	try {
		const res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			const text = await res.text().catch(() => "");
			return { ok: false, error: `HTTP ${res.status} ${text}`.slice(0, 500) };
		}
		return { ok: true };
	} catch (e) {
		return { ok: false, error: (e as Error).message.slice(0, 500) };
	}
}

// Fan out to both configured webhooks. Skips rows with empty URL or with
// the corresponding notify toggle off. Records last-fired / last-error.
// Never throws — webhook failures should never break the live-state flow.
export async function fanOutDiscord(event: FanoutEvent, input: EmbedInput) {
	const db = createDb();
	const rows = await db.select().from(webhooks).all();
	if (rows.length === 0) return;

	const body = buildEmbed(event, input);
	const now = new Date();

	await Promise.all(
		rows.map(async (row) => {
			if (!row.url) return;
			if (event === "live" && !row.notifyOnLive) return;
			if (event === "end" && !row.notifyOnEnd) return;

			const result = await postOne(row.url, body);
			await db
				.update(webhooks)
				.set(result.ok ? { lastFiredAt: now, lastError: null } : { lastError: result.error })
				.where(eq(webhooks.id, row.id));
		}),
	);
}
