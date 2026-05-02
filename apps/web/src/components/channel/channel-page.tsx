"use client";

// The channel page IS the home page (`/`). Single broadcaster, single tenant —
// no /[username] route. Layout matches design-handoff/project/HowlCast.html
// at the structural level: player card on left column, streamer info row
// directly below, panels grid, chat dock on the right (340-360px).
//
// Player + chat are placeholders here — Phase 4 wires the actual GetStream
// SDK + chat. For now we drive the LIVE badge and viewer-count UI off the
// `stream.isLive` query, polling every 10s. When public mode is on, the
// chat input is replaced with the invite-only CTA card.

import { useQuery } from "@tanstack/react-query";
import {
	BadgeCheck,
	Eye,
	Mail,
	MessageSquareOff,
	PawPrint,
	Settings,
} from "lucide-react";
import { trpc } from "@/utils/trpc";

const POLL_MS = 10_000;

export default function ChannelPage() {
	const info = useQuery(trpc.channel.getInfo.queryOptions());
	const live = useQuery({
		...trpc.stream.isLive.queryOptions(),
		refetchInterval: POLL_MS,
	});
	const panelsQuery = useQuery(trpc.channel.getPanels.queryOptions());

	const isLive = !!live.data?.isLive;
	const visibility = info.data?.visibility ?? "public";
	const isPrivate = visibility === "invite_only";
	const broadcaster = info.data?.broadcaster ?? null;
	const title = info.data?.title ?? null;

	return (
		<main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6">
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
				<section className="flex flex-col gap-4">
					<PlayerSlot isLive={isLive} />

					<StreamerInfo
						displayName={broadcaster?.displayName ?? "MrDemonWolf"}
						verified={broadcaster?.verified ?? false}
						title={title}
						isPrivate={isPrivate}
					/>

					<PanelsGrid panels={panelsQuery.data ?? []} />
				</section>

				<aside className="lg:sticky lg:top-6 lg:self-start">
					<ChatDock isPrivate={isPrivate} />
				</aside>
			</div>
		</main>
	);
}

function PlayerSlot({ isLive }: { isLive: boolean }) {
	return (
		<div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-black">
			<div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
				<span className="font-mono uppercase tracking-wider">
					{isLive ? "live · 1080p · 60fps" : "offline"}
				</span>
			</div>
			{isLive ? (
				<>
					<span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-[var(--live)] px-2 py-1 font-mono text-[10px] text-white uppercase tracking-wider">
						<i className="block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
						Live
					</span>
					<span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white backdrop-blur">
						<Eye className="h-3 w-3" aria-hidden="true" />
						<span className="font-mono">—</span>
					</span>
				</>
			) : null}
		</div>
	);
}

function StreamerInfo({
	displayName,
	verified,
	title,
	isPrivate,
}: {
	displayName: string;
	verified: boolean;
	title: string | null;
	isPrivate: boolean;
}) {
	return (
		<div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
			<div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-cyan-soft font-display font-semibold text-fg text-lg uppercase">
				{displayName.charAt(0)}
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5">
					<h1 className="truncate font-display font-semibold text-foreground text-lg">
						{displayName}
					</h1>
					{verified ? (
						<BadgeCheck
							className="h-4 w-4 flex-none text-cyan"
							aria-label="verified"
						/>
					) : null}
				</div>
				<p className="mt-0.5 truncate text-muted-foreground text-sm">
					{title ?? "No stream title yet."}
				</p>
			</div>
			<ModePill isPrivate={isPrivate} />
		</div>
	);
}

function ModePill({ isPrivate }: { isPrivate: boolean }) {
	const cls = isPrivate
		? "border-[oklch(0.6_0.16_290_/_0.5)] bg-[oklch(0.4_0.12_290_/_0.22)] text-[oklch(0.82_0.14_295)]"
		: "border-[oklch(0.78_0.17_162_/_0.4)] bg-[oklch(0.4_0.13_162_/_0.18)] text-success";
	return (
		<span
			className={`hidden flex-none items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider sm:inline-flex ${cls}`}
		>
			<PawPrint className="h-3 w-3" aria-hidden="true" />
			{isPrivate ? "Private · invite-only" : "Public · open watch"}
		</span>
	);
}

type Panel = {
	id: string;
	position: number;
	title: string | null;
	body: string | null;
	imageKey: string | null;
	linkUrl: string | null;
};

function PanelsGrid({ panels }: { panels: Panel[] }) {
	if (panels.length === 0) return null;
	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{panels.map((p) => (
				<PanelCard key={p.id} panel={p} />
			))}
		</div>
	);
}

function PanelCard({ panel }: { panel: Panel }) {
	const inner = (
		<article className="flex h-full flex-col rounded-lg border border-border bg-card p-4 transition hover:border-line-3">
			{panel.title ? (
				<h2 className="font-display font-semibold text-foreground text-sm">
					{panel.title}
				</h2>
			) : null}
			{panel.body ? (
				<p className="mt-1.5 line-clamp-6 whitespace-pre-line text-muted-foreground text-sm">
					{panel.body}
				</p>
			) : null}
		</article>
	);
	if (panel.linkUrl) {
		return (
			<a
				href={panel.linkUrl}
				target="_blank"
				rel="noopener noreferrer"
				className="block"
			>
				{inner}
			</a>
		);
	}
	return inner;
}

function ChatDock({ isPrivate }: { isPrivate: boolean }) {
	return (
		<div className="flex h-[640px] flex-col rounded-lg border border-border bg-card">
			<header className="flex items-center justify-between border-border border-b px-4 py-3">
				<span className="font-medium text-foreground text-sm">Stream chat</span>
				<button
					type="button"
					aria-label="Chat settings"
					className="text-muted-foreground hover:text-foreground"
				>
					<Settings className="h-4 w-4" />
				</button>
			</header>

			<div className="flex flex-1 items-center justify-center px-6 text-center">
				<div className="flex flex-col items-center gap-2 text-muted-foreground">
					<MessageSquareOff className="h-6 w-6" aria-hidden="true" />
					<p className="text-sm">Chat ships with Phase 4.</p>
				</div>
			</div>

			{isPrivate ? (
				<div className="border-border border-t p-3">
					<div className="flex items-start gap-3 rounded-md border border-cyan-soft bg-cyan-glow p-3">
						<Mail className="mt-0.5 h-4 w-4 flex-none text-cyan" />
						<div className="min-w-0">
							<p className="font-medium text-foreground text-sm">
								Chat is invite-only.
							</p>
							<p className="mt-0.5 text-muted-foreground text-xs">
								Watching is open to anyone. Posting is for the den. DM{" "}
								<span className="font-mono text-cyan">@mrdemonwolf</span> to get
								in.
							</p>
						</div>
					</div>
				</div>
			) : (
				<div className="border-border border-t p-3">
					<input
						type="text"
						disabled
						placeholder="Send a message"
						className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 disabled:cursor-not-allowed"
					/>
				</div>
			)}
		</div>
	);
}
