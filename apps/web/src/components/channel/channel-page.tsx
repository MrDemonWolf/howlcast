"use client";

// The channel page IS the home page (`/`). Single-tenant — no /[username]
// route. Layout matches design-handoff/howcast-v2/project (the Den): a
// `1fr 360px` grid on desktop with the player surface + meta row + 6-panel
// grid in the left column and the chat dock on the right.
//
// Visibility:
//   - public           → anyone watches; chat open to invited members.
//   - invite_only      → signed-in viewers see the Den; signed-out viewers
//                        see <PrivateGate>.
//
// The Player + Chat slots are filled by lazy-loaded GetStream SDK
// components — 200KB+ minified. Loading them dynamically means anonymous
// viewers landing while offline don't pay the cost.

import { Avatar } from "@howlcast/ui/components/avatar";
import { Button } from "@howlcast/ui/components/button";
import { Eyebrow } from "@howlcast/ui/components/eyebrow";
import { LivePill } from "@howlcast/ui/components/live-pill";
import { PinnedMessage } from "@howlcast/ui/components/pinned-message";
import { Verified } from "@howlcast/ui/components/verified";
import { ViewerChip } from "@howlcast/ui/components/viewer-chip";
import { useQuery } from "@tanstack/react-query";
import { Bell, ExternalLink, MoreHorizontal, Settings, Share2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { authClient } from "@/lib/auth-client";
import SiteFooter from "@/components/site-footer";
import { trpc } from "@/utils/trpc";

import { OfflineBanner } from "./offline-banner";
import { PrivateGate } from "./private-gate";

const POLL_MS = 10_000;

const LivePlayer = dynamic(() => import("./live-player"), {
	ssr: false,
	loading: () => null,
});

const LiveChat = dynamic(() => import("./live-chat"), {
	ssr: false,
	loading: () => (
		<div
			className="flex flex-1 items-center justify-center text-xs"
			style={{ color: "var(--fg-3)" }}
		>
			Loading chat…
		</div>
	),
});

export default function ChannelPage() {
	const session = authClient.useSession();
	const info = useQuery(trpc.channel.getInfo.queryOptions());
	const live = useQuery({
		...trpc.stream.isLive.queryOptions(),
		refetchInterval: POLL_MS,
	});
	const panelsQuery = useQuery(trpc.channel.getPanels.queryOptions());

	// Stream credentials — only requested when GetStream is configured.
	// `getViewerToken` will throw PRECONDITION_FAILED if keys are empty,
	// caught by the query and surfaced via react-query's error handler.
	// staleTime: Infinity + no refocus refetch keeps the SDK clients from
	// remounting on tab focus, which used to trigger connect/disconnect races.
	const credentials = useQuery({
		...trpc.stream.getStreamCredentials.queryOptions(),
		retry: false,
		refetchOnWindowFocus: false,
		staleTime: Infinity,
	});
	const viewerToken = useQuery({
		...trpc.stream.getViewerToken.queryOptions(),
		retry: false,
		refetchOnWindowFocus: false,
		staleTime: Infinity,
	});

	const [viewerCount, setViewerCount] = useState<number | null>(null);
	const handleViewerCount = useCallback((n: number) => setViewerCount(n), []);

	const isLive = !!live.data?.isLive;
	const visibility = info.data?.visibility ?? "public";
	const isPrivate = visibility === "invite_only";
	const broadcaster = info.data?.broadcaster ?? null;
	const title = info.data?.title ?? null;
	const isSignedIn = !!session.data?.user;

	// Gate: invite-only + not signed in → PrivateGate. Public stream is open
	// to anyone — they can watch even when signed-out (chat posting still
	// requires invite via canPost flag).
	if (isPrivate && !isSignedIn && !session.isPending) {
		return (
			<PrivateGate
				displayName={broadcaster?.displayName ?? null}
				avatarUrl={null}
				isLive={isLive}
			/>
		);
	}

	const canMountStream =
		!!viewerToken.data && !!credentials.data?.callId && !!credentials.data?.channelCid;
	const isGuest = viewerToken.data?.isGuest ?? true;

	return (
		<div className="flex min-h-svh flex-col">
			<main className="grid flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-0">
				<section className="scroll-y px-4 py-6 lg:px-6">
					<PlayerSurface
						isLive={isLive}
						viewerCount={viewerCount}
						displayName={broadcaster?.displayName ?? null}
						credentials={
							canMountStream && isLive
								? {
										apiKey: viewerToken.data!.apiKey,
										userId: viewerToken.data!.userId,
										token: viewerToken.data!.token,
										callId: credentials.data!.callId!,
										isGuest,
									}
								: null
						}
						onViewerCount={handleViewerCount}
					/>

					<StreamerInfo
						displayName={broadcaster?.displayName ?? "HowlCast"}
						verified={broadcaster?.verified ?? false}
						title={title}
						isLive={isLive}
					/>

					<PanelsGrid panels={panelsQuery.data ?? []} />
				</section>

				<aside
					className="lg:sticky lg:top-0 lg:h-svh"
					style={{ borderLeft: "1px solid var(--line)" }}
				>
					<ChatDock
						isPrivate={isPrivate}
						credentials={
							canMountStream
								? isGuest
									? {
											kind: "anonymous" as const,
											apiKey: viewerToken.data!.apiKey,
											channelCid: credentials.data!.channelCid!,
											canPost: false as const,
										}
									: {
											kind: "user" as const,
											apiKey: viewerToken.data!.apiKey,
											userId: viewerToken.data!.userId,
											token: viewerToken.data!.token,
											channelCid: credentials.data!.channelCid!,
											canPost: true,
										}
								: null
						}
					/>
				</aside>
			</main>
			<SiteFooter />
		</div>
	);
}

type PlayerCreds = {
	apiKey: string;
	userId: string;
	token: string;
	callId: string;
	isGuest: boolean;
};

function PlayerSurface({
	isLive,
	credentials,
	viewerCount,
	displayName,
	onViewerCount,
}: {
	isLive: boolean;
	credentials: PlayerCreds | null;
	viewerCount: number | null;
	displayName: string | null;
	onViewerCount: (n: number) => void;
}) {
	return (
		<div className="player-surface" data-slot="player-surface">
			{isLive && credentials ? (
				<>
					<LivePlayer {...credentials} onViewerCount={onViewerCount} />
					<div className="pointer-events-none absolute top-3.5 left-3.5 flex gap-2">
						<LivePill />
					</div>
					<div className="pointer-events-none absolute top-3.5 right-3.5 flex gap-2">
						<ViewerChip count={viewerCount ?? 0} />
					</div>
				</>
			) : isLive ? (
				/* Live but credentials still loading — minimal placeholder. */
				<div
					className="absolute inset-0 flex items-center justify-center"
					style={{
						color: "var(--fg-4)",
						fontFamily: "var(--font-mono)",
						fontSize: 11,
						letterSpacing: "0.08em",
						textTransform: "uppercase",
					}}
				>
					connecting…
				</div>
			) : (
				<OfflineBanner displayName={displayName} />
			)}
		</div>
	);
}

function StreamerInfo({
	displayName,
	verified,
	title,
	isLive,
}: {
	displayName: string;
	verified: boolean;
	title: string | null;
	isLive: boolean;
}) {
	return (
		<div className="mt-4 flex items-start gap-4">
			<Avatar size={56} name={displayName} hue={252} halo live={isLive} />
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<div
						className="font-display font-bold"
						style={{
							fontSize: 22,
							letterSpacing: "-0.022em",
						}}
					>
						{displayName}
					</div>
					{verified && <Verified />}
				</div>
				<div className="mt-1 truncate text-sm" style={{ color: "var(--fg-2)" }}>
					{title ?? "No stream title yet."}
				</div>
				{/* Tags are part of the design but DESIGN-DECISIONS removes them.
				    Render any title-derived metadata only — keep this slot for
				    future feature expansion. */}
				<TagRow />
			</div>
			<div className="flex gap-1">
				<Button variant="ghost" size="icon" aria-label="Share" title="Share">
					<Share2 aria-hidden />
				</Button>
				<Button variant="ghost" size="icon" aria-label="Notifications" title="Notifications">
					<Bell aria-hidden />
				</Button>
				<Button variant="ghost" size="icon" aria-label="More" title="More">
					<MoreHorizontal aria-hidden />
				</Button>
			</div>
		</div>
	);
}

function TagRow() {
	// Single-tenant, no discovery — render zero generic tags. Kept as a
	// component so future "Now playing"-type pills slot in cleanly.
	return null;
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
		<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{panels.map((p) => (
				<PanelCard key={p.id} panel={p} />
			))}
		</div>
	);
}

function PanelCard({ panel }: { panel: Panel }) {
	const inner = (
		<article
			className="flex h-full flex-col rounded-[var(--radius-lg)] border bg-[var(--bg-2)] p-[18px] transition hover:-translate-y-px"
			style={{ borderColor: "var(--line)" }}
		>
			{panel.title && <Eyebrow className="mb-2.5">{panel.title}</Eyebrow>}
			{panel.body && (
				<p
					className="m-0 line-clamp-6 whitespace-pre-line text-[13.5px] leading-relaxed"
					style={{ color: "var(--fg-2)" }}
				>
					{panel.body}
				</p>
			)}
			{panel.linkUrl && (
				<span
					className="mt-3 inline-flex items-center gap-1 text-xs"
					style={{ color: "var(--cyan)" }}
				>
					<ExternalLink size={12} aria-hidden />
					Open link
				</span>
			)}
		</article>
	);
	if (panel.linkUrl) {
		return (
			<a href={panel.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
				{inner}
			</a>
		);
	}
	return inner;
}

type ChatCreds =
	| {
			kind: "anonymous";
			apiKey: string;
			channelCid: string;
			canPost: false;
	  }
	| {
			kind: "user";
			apiKey: string;
			userId: string;
			token: string;
			channelCid: string;
			canPost: boolean;
	  };

function ChatDock({
	isPrivate,
	credentials,
}: {
	isPrivate: boolean;
	credentials: ChatCreds | null;
}) {
	return (
		<div
			className="flex h-full min-h-[600px] flex-col"
			style={{ background: "var(--bg)" }}
			data-slot="chat-dock"
		>
			<div
				className="flex h-11 items-center justify-between px-3.5"
				style={{ borderBottom: "1px solid var(--line)" }}
			>
				<Eyebrow>CHAT</Eyebrow>
				<div className="flex gap-1">
					<Button variant="ghost" size="icon-sm" title="Settings" aria-label="Chat settings">
						<Settings aria-hidden />
					</Button>
					<a
						href="/popout/chat"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Pop chat into its own window"
						title="Pop out"
					>
						<Button variant="ghost" size="icon-sm" tabIndex={-1}>
							<ExternalLink aria-hidden />
						</Button>
					</a>
				</div>
			</div>

			<PinnedMessage>Be useful or be silent. No spoilers without /spoiler.</PinnedMessage>

			<div className="relative flex-1 overflow-hidden">
				{credentials ? (
					credentials.kind === "anonymous" ? (
						<LiveChat
							kind="anonymous"
							apiKey={credentials.apiKey}
							channelCid={credentials.channelCid}
						/>
					) : (
						<LiveChat
							kind="user"
							apiKey={credentials.apiKey}
							userId={credentials.userId}
							token={credentials.token}
							channelCid={credentials.channelCid}
							canPost={credentials.canPost}
						/>
					)
				) : (
					<div
						className="flex h-full items-center justify-center px-6 text-center text-xs"
						style={{ color: "var(--fg-3)" }}
					>
						Chat opens when {isPrivate ? "the den" : "the broadcaster"} is live.
					</div>
				)}
				{credentials && !credentials.canPost && <LockedComposerOverlay />}
			</div>
		</div>
	);
}

function LockedComposerOverlay() {
	return (
		<div
			className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center px-4 pt-12 pb-4"
			style={{
				background:
					"linear-gradient(180deg, transparent, color-mix(in oklab, var(--bg) 80%, transparent) 40%, var(--bg))",
				backdropFilter: "blur(2px)",
			}}
		>
			<div className="pointer-events-auto flex flex-col items-center gap-1.5 text-center">
				<a href="/login">
					<Button size="sm">Sign in to chat</Button>
				</a>
				<span className="text-[11px]" style={{ color: "var(--fg-4)" }}>
					Watching is open. Posting is for the den.
				</span>
			</div>
		</div>
	);
}
