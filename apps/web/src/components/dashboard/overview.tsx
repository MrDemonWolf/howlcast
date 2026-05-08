"use client";

// Dashboard overview tiles. Matches design v2 prototype's DashboardOverview
// (pages-dashboard.jsx → DashboardOverview): four stat tiles up top, then
// the existing stream wizard sits below for the actual go-live flow.

import { Card } from "@howlcast/ui/components/card";
import { Eyebrow } from "@howlcast/ui/components/eyebrow";
import { Sparkline } from "@howlcast/ui/components/sparkline";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

interface StatTileProps {
	label: string;
	value: string;
	hint?: string;
	chart?: number[];
}

function StatTile({ label, value, hint, chart }: StatTileProps) {
	return (
		<Card className="gap-2 px-[18px] py-[18px] bg-[var(--bg-2)] border-[var(--line)]">
			<Eyebrow>{label}</Eyebrow>
			<div className="flex items-end justify-between gap-3">
				<div className="font-display font-bold text-[28px] tracking-[-0.022em] leading-none">
					{value}
				</div>
				{chart && chart.length > 1 && <Sparkline points={chart} width={92} height={28} fill />}
			</div>
			{hint && <div className="text-xs text-[var(--fg-3)]">{hint}</div>}
		</Card>
	);
}

export function DashboardOverview() {
	const live = useQuery({
		...trpc.stream.isLive.queryOptions(),
		refetchInterval: 10_000,
	});

	// Sample sparkline series — replace with the real stats router when the
	// dashboard.metrics query lands. Keeps the layout populated and gives
	// the design something to reflow against in dev.
	const viewerSpark = [12, 18, 22, 19, 28, 34, 31, 40, 36, 44, 51, 48, 55];
	const chatSpark = [3, 4, 6, 5, 9, 12, 11, 14, 13, 17, 19, 18, 22];

	const lastStreamHint = live.data?.startedAt
		? `Last live ${formatRelative(new Date(live.data.startedAt))}`
		: "No streams yet";

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<StatTile
				label="LAST STREAM"
				value={live.data?.isLive ? "Live now" : "Ready"}
				hint={lastStreamHint}
			/>
			<StatTile label="AVG VIEWERS" value="—" chart={viewerSpark} hint="Last 14 streams" />
			<StatTile label="CHAT MSGS / MIN" value="—" chart={chatSpark} hint="Live average" />
			<StatTile label="STREAM KEY" value="Rotated" hint="Last rotated 14d ago" />
		</div>
	);
}

function formatRelative(d: Date): string {
	const diffMs = Date.now() - d.getTime();
	const minutes = Math.round(diffMs / 60_000);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 48) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	return `${days}d ago`;
}
