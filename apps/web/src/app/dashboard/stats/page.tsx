"use client";

// Live → Stats. Phase 6 first ship. Pulls last-7d aggregates from the
// stream_sessions table (written by the GetStream webhook on
// call.live_started + call.session_ended) and renders 3 top-line cards
// plus a session list. No charting library — just numbers + a table.

import { useQuery } from "@tanstack/react-query";
import { Activity, Clock, Flame, History } from "lucide-react";

import HeaderStrip from "@/components/dashboard/header-strip";
import { trpc } from "@/utils/trpc";

export default function StatsPage() {
	const stats = useQuery({ ...trpc.stream.getStats.queryOptions(), retry: false });

	const totalMinutes = stats.data?.totalMinutesLast7d ?? 0;
	const totalSessions = stats.data?.totalSessionsLast7d ?? 0;
	const streak = stats.data?.currentStreak ?? 0;

	return (
		<>
			<HeaderStrip title="Stats" subtitle="Live · last 7 days" />

			<section className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<StatCard
					icon={<Clock className="h-4 w-4 text-cyan" />}
					label="Total minutes"
					value={formatMinutes(totalMinutes)}
					hint="Live time over the last 7 days"
				/>
				<StatCard
					icon={<Activity className="h-4 w-4 text-cyan" />}
					label="Sessions"
					value={String(totalSessions)}
					hint="Distinct go-live events"
				/>
				<StatCard
					icon={<Flame className="h-4 w-4 text-cyan" />}
					label="Current streak"
					value={`${streak} day${streak === 1 ? "" : "s"}`}
					hint="Consecutive days streamed"
				/>
			</section>

			<section className="rounded-lg border border-border bg-card">
				<header className="flex items-center justify-between border-border border-b px-5 py-3">
					<h2 className="font-display font-semibold text-foreground text-sm">Recent sessions</h2>
					<span className="font-mono text-[10px] text-fg-3 uppercase tracking-wider">
						<History className="mr-1 inline h-3 w-3" aria-hidden /> Last 7 days
					</span>
				</header>

				{stats.isLoading ? (
					<div className="px-5 py-8 text-center text-muted-foreground text-sm">Loading…</div>
				) : stats.error ? (
					<div className="px-5 py-8 text-center text-live text-sm">
						Couldn't load stats: {stats.error.message}
					</div>
				) : (stats.data?.sessions.length ?? 0) === 0 ? (
					<div className="px-5 py-12 text-center">
						<p className="font-medium text-foreground">No sessions yet</p>
						<p className="mt-1 text-muted-foreground text-sm">
							Once you go live, sessions will appear here automatically.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-fg-3 text-xs">
									<th className="px-5 py-2 text-left font-mono uppercase tracking-wider">
										Started
									</th>
									<th className="px-5 py-2 text-left font-mono uppercase tracking-wider">
										Duration
									</th>
									<th className="px-5 py-2 text-left font-mono uppercase tracking-wider">Ended</th>
									<th className="px-5 py-2 text-right font-mono uppercase tracking-wider">
										Peak viewers
									</th>
								</tr>
							</thead>
							<tbody>
								{stats.data!.sessions.map((s) => (
									<tr key={s.id} className="border-border border-t">
										<td className="px-5 py-3 text-foreground">{formatTime(s.startedAt)}</td>
										<td className="px-5 py-3 font-mono text-fg-2">
											{s.endedAt ? formatMinutes(s.totalMinutes) : "live"}
										</td>
										<td className="px-5 py-3 text-fg-2">
											{s.endedAt ? formatTime(s.endedAt) : "—"}
										</td>
										<td className="px-5 py-3 text-right font-mono text-fg-2">{s.peakViewers}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{stats.data?.firstSessionAt ? (
				<p className="font-mono text-[11px] text-fg-4 uppercase tracking-wider">
					Streaming since {formatDate(stats.data.firstSessionAt)}
				</p>
			) : null}
		</>
	);
}

function StatCard({
	icon,
	label,
	value,
	hint,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	hint: string;
}) {
	return (
		<div className="rounded-lg border border-border bg-card p-5">
			<div className="flex items-center gap-2">
				{icon}
				<span className="font-mono text-[10px] text-fg-3 uppercase tracking-wider">{label}</span>
			</div>
			<div className="mt-2 font-display font-semibold text-3xl text-foreground tracking-tight">
				{value}
			</div>
			<p className="mt-1 text-muted-foreground text-xs">{hint}</p>
		</div>
	);
}

function formatMinutes(mins: number): string {
	if (mins < 60) return `${mins}m`;
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatTime(ms: number): string {
	const d = new Date(ms);
	return d.toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function formatDate(ms: number): string {
	const d = new Date(ms);
	return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
