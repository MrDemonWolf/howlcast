"use client";

// Per-session analytics. Header card with totals, viewer line chart over the
// session, chat-msgs-per-minute bar chart. Powered by stream.getSessionDetail
// which joins stream_sessions + stream_viewer_snapshots + stream_chat_minutes.

import { Sparkline } from "@howlcast/ui/components/sparkline";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import HeaderStrip from "@/components/dashboard/header-strip";
import { trpc } from "@/utils/trpc";

export default function SessionDetailPage() {
	const params = useParams<{ id: string }>();
	const id = params?.id ?? "";
	const detail = useQuery({
		...trpc.stream.getSessionDetail.queryOptions({ id }),
		enabled: !!id,
		retry: false,
	});

	if (detail.isLoading) {
		return (
			<>
				<HeaderStrip title="Session detail" eyebrow="STATS" />
				<p className="text-muted-foreground text-sm">Loading…</p>
			</>
		);
	}

	if (detail.error || !detail.data) {
		return (
			<>
				<HeaderStrip title="Session detail" eyebrow="STATS" />
				<p className="text-live text-sm">
					Couldn't load session: {detail.error?.message ?? "not found"}
				</p>
				<Link href="/dashboard/stats" className="mt-4 inline-flex items-center gap-1.5 text-cyan">
					<ArrowLeft className="h-3.5 w-3.5" /> Back to stats
				</Link>
			</>
		);
	}

	const { session, viewerSnapshots, chatMinutes } = detail.data;
	const durationMin = session.endedAt
		? Math.round((session.endedAt - session.startedAt) / 60_000)
		: Math.round((Date.now() - session.startedAt) / 60_000);
	const avgViewers = viewerSnapshots.length
		? Math.round(viewerSnapshots.reduce((s, p) => s + p.viewerCount, 0) / viewerSnapshots.length)
		: 0;

	return (
		<>
			<HeaderStrip
				title="Session detail"
				subtitle={`${formatTime(session.startedAt)} → ${session.endedAt ? formatTime(session.endedAt) : "live"}`}
				eyebrow="STATS"
			/>

			<Link
				href="/dashboard/stats"
				className="-mt-4 mb-2 inline-flex items-center gap-1.5 text-fg-3 text-xs hover:text-foreground"
			>
				<ArrowLeft className="h-3 w-3" /> Back to all sessions
			</Link>

			<section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<TopCard
					icon={<Users className="h-4 w-4 text-cyan" />}
					label="Peak viewers"
					value={String(session.peakViewers)}
				/>
				<TopCard
					icon={<Users className="h-4 w-4 text-cyan" />}
					label="Avg viewers"
					value={String(avgViewers)}
				/>
				<TopCard
					icon={<MessageSquare className="h-4 w-4 text-cyan" />}
					label="Chat messages"
					value={String(session.chatMessageCount)}
				/>
				<TopCard
					icon={<Clock className="h-4 w-4 text-cyan" />}
					label="Duration"
					value={formatMinutes(durationMin)}
				/>
			</section>

			<section className="rounded-[var(--radius-lg)] border border-border bg-card">
				<header className="flex items-center justify-between border-border border-b px-5 py-3">
					<h2 className="font-display font-semibold text-foreground text-sm">Viewers over time</h2>
					<span className="font-mono text-[10px] text-fg-3 uppercase tracking-wider">
						{viewerSnapshots.length} samples
					</span>
				</header>
				<div className="px-5 py-4 text-cyan">
					{viewerSnapshots.length < 2 ? (
						<p className="py-8 text-center text-muted-foreground text-sm">
							Not enough data yet — viewers and minute samples appear once people join.
						</p>
					) : (
						<Sparkline
							points={viewerSnapshots.map((s) => s.viewerCount)}
							width={800}
							height={140}
							fill
							className="w-full"
						/>
					)}
				</div>
			</section>

			<section className="rounded-[var(--radius-lg)] border border-border bg-card">
				<header className="flex items-center justify-between border-border border-b px-5 py-3">
					<h2 className="font-display font-semibold text-foreground text-sm">
						Chat messages per minute
					</h2>
					<span className="font-mono text-[10px] text-fg-3 uppercase tracking-wider">
						{chatMinutes.length} bins
					</span>
				</header>
				<div className="px-5 py-4">
					{chatMinutes.length === 0 ? (
						<p className="py-8 text-center text-muted-foreground text-sm">
							No chat activity recorded for this session.
						</p>
					) : (
						<ChatBars minutes={chatMinutes} />
					)}
				</div>
			</section>
		</>
	);
}

function TopCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return (
		<div className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
			<div className="flex items-center gap-2">
				{icon}
				<span className="font-mono text-[10px] text-fg-3 uppercase tracking-wider">{label}</span>
			</div>
			<div className="mt-2 font-display font-semibold text-3xl text-foreground tracking-tight">
				{value}
			</div>
		</div>
	);
}

function ChatBars({ minutes }: { minutes: { minuteBucketMs: number; count: number }[] }) {
	const max = Math.max(1, ...minutes.map((m) => m.count));
	const W = 800;
	const H = 140;
	const barW = Math.max(2, W / minutes.length - 2);
	return (
		<svg
			viewBox={`0 0 ${W} ${H}`}
			className="block w-full text-cyan"
			preserveAspectRatio="none"
			aria-hidden
		>
			{minutes.map((m, i) => {
				const h = (m.count / max) * (H - 8);
				return (
					<rect
						key={m.minuteBucketMs}
						x={i * (W / minutes.length)}
						y={H - h}
						width={barW}
						height={h}
						fill="currentColor"
						opacity={0.85}
					/>
				);
			})}
		</svg>
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
