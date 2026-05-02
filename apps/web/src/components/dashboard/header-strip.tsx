"use client";

// Dashboard top header strip. Visible only inside /dashboard. Shows the
// on-air status pill (drives off `stream.isLive`), title, and right-side
// actions (View channel link, Streamer Mode toggle is Phase 5.2 polish).

import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { trpc } from "@/utils/trpc";

const POLL_MS = 10_000;

export default function HeaderStrip({ title, subtitle }: { title: string; subtitle?: string }) {
	const live = useQuery({
		...trpc.stream.isLive.queryOptions(),
		refetchInterval: POLL_MS,
	});
	const isLive = !!live.data?.isLive;

	return (
		<header className="flex flex-wrap items-end justify-between gap-6 border-border border-b pb-5">
			<div className="min-w-0">
				<h1 className="font-display font-semibold text-3xl text-foreground leading-tight tracking-tight">
					{title}
				</h1>
				{subtitle ? (
					<p className="mt-1.5 font-mono text-muted-foreground text-xs tracking-wider">
						{subtitle}
					</p>
				) : null}
			</div>
			<div className="flex items-center gap-2">
				<span
					className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
						isLive
							? "border-[oklch(0.65_0.24_25_/_0.5)] bg-[oklch(0.65_0.24_25_/_0.18)] text-live"
							: "border-border bg-bg-2 text-fg-3"
					}`}
				>
					<span
						className={`block h-1.5 w-1.5 rounded-full ${isLive ? "bg-live animate-pulse" : "bg-fg-4"}`}
					/>
					{isLive ? "On Air" : "Off Air"}
				</span>
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-2 px-3 py-1.5 text-fg-2 text-sm hover:bg-bg-3 hover:text-foreground"
				>
					<ExternalLink className="h-3.5 w-3.5" aria-hidden />
					View channel
				</Link>
			</div>
		</header>
	);
}
