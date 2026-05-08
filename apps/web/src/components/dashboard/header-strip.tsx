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
				<h1
					className="font-display font-bold"
					style={{
						fontSize: 32,
						margin: 0,
						letterSpacing: "-0.025em",
						lineHeight: 1.05,
					}}
				>
					{title}
				</h1>
				{subtitle && (
					<div className="mt-1.5 text-sm" style={{ color: "var(--fg-3)" }}>
						{subtitle}
					</div>
				)}
			</div>
			<div className="flex items-center gap-2">
				{showOnAir &&
					(isLive ? (
						<LivePill>ON AIR</LivePill>
					) : (
						<span
							className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]"
							style={{
								borderColor: "var(--line)",
								background: "var(--bg-2)",
								color: "var(--fg-3)",
								fontFamily: "var(--font-mono)",
								letterSpacing: "0.08em",
							}}
						>
							<span
								className="block h-1.5 w-1.5 rounded-full"
								style={{ background: "var(--fg-4)" }}
							/>
							OFF AIR
						</span>
					))}
				{right}
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm transition"
					style={{
						borderColor: "var(--line)",
						background: "var(--bg-2)",
						color: "var(--fg-2)",
					}}
				>
					<ExternalLink size={14} aria-hidden />
					View channel
				</Link>
			</div>
		</header>
	);
}
