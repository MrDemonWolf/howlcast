"use client";

// Dashboard top header strip — used by every /dashboard sub-page. Matches
// design v2 prototype's PageHeader: large display title, optional subtitle,
// and a right-hand cluster (LIVE/Off-air pill + "View channel"). The
// sidebar owns the Streamer Mode toggle now.

import { Eyebrow } from "@howlcast/ui/components/eyebrow";
import { LivePill } from "@howlcast/ui/components/live-pill";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { trpc } from "@/utils/trpc";

const POLL_MS = 10_000;

interface HeaderStripProps {
	title: string;
	subtitle?: string;
	eyebrow?: string;
	right?: ReactNode;
	showOnAir?: boolean;
}

export default function HeaderStrip({
	title,
	subtitle,
	eyebrow,
	right,
	showOnAir = true,
}: HeaderStripProps) {
	const live = useQuery({
		...trpc.stream.isLive.queryOptions(),
		refetchInterval: POLL_MS,
		enabled: showOnAir,
	});
	const isLive = !!live.data?.isLive;

	return (
		<header className="mb-7 flex flex-wrap items-end justify-between gap-4">
			<div className="min-w-0">
				{eyebrow && <Eyebrow className="mb-2 block">{eyebrow}</Eyebrow>}
				<h1 className="m-0 font-display font-bold text-[32px] tracking-[-0.025em] leading-[1.05]">
					{title}
				</h1>
				{subtitle && <div className="mt-1.5 text-sm text-[var(--fg-3)]">{subtitle}</div>}
			</div>
			<div className="flex items-center gap-2">
				{showOnAir &&
					(isLive ? (
						<LivePill>ON AIR</LivePill>
					) : (
						<span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1 font-mono text-[11px] text-[var(--fg-3)] tracking-[0.08em]">
							<span className="block h-1.5 w-1.5 rounded-full bg-[var(--fg-4)]" />
							OFF AIR
						</span>
					))}
				{right}
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--bg-2)] px-3 py-1.5 text-sm text-[var(--fg-2)] transition"
				>
					<ExternalLink size={14} aria-hidden />
					View channel
				</Link>
			</div>
		</header>
	);
}
