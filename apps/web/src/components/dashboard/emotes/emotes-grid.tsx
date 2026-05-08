"use client";

// Flat emote list pulled from the merged KV map. Refresh button kicks
// the same pipeline the cron uses. Provider badge per row.

import { Button } from "@howlcast/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

const PROVIDER_COLOR: Record<string, string> = {
	"7tv": "bg-cyan-glow text-cyan",
	bttv: "bg-[oklch(0.4_0.13_25_/_0.18)] text-[oklch(0.78_0.17_25)]",
	ffz: "bg-[oklch(0.4_0.13_270_/_0.18)] text-[oklch(0.78_0.13_270)]",
	twitch: "bg-[oklch(0.4_0.13_290_/_0.22)] text-[oklch(0.82_0.14_295)]",
};

export default function EmotesGrid() {
	const queryClient = useQueryClient();
	const list = useQuery(trpc.channel.getEmotes.queryOptions());
	const refresh = useMutation(
		trpc.channel.refreshEmotes.mutationOptions({
			onSuccess: (data) => {
				toast.success(`Refreshed — ${data.count} emotes.`);
				queryClient.invalidateQueries({ queryKey: trpc.channel.getEmotes.queryKey() });
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const emotes = list.data?.emotes ?? [];
	const updatedAt = list.data?.updatedAt ?? 0;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<p className="text-muted-foreground text-sm">
					{emotes.length} emote{emotes.length === 1 ? "" : "s"}
					{updatedAt
						? ` · last refreshed ${new Date(updatedAt).toLocaleString()}`
						: " · not yet fetched"}
				</p>
				<Button
					type="button"
					size="sm"
					onClick={() => refresh.mutate()}
					disabled={refresh.isPending}
				>
					<RefreshCw
						className={`mr-1.5 h-3.5 w-3.5 ${refresh.isPending ? "animate-spin" : ""}`}
						aria-hidden
					/>
					{refresh.isPending ? "Refreshing…" : "Refresh"}
				</Button>
			</div>

			{emotes.length === 0 ? (
				<div className="rounded-[var(--radius-lg)] border border-border border-dashed bg-card p-8 text-center text-muted-foreground text-sm">
					No emotes yet. Connect 7TV / BTTV / FFZ for your Twitch channel to see them here.
				</div>
			) : (
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{emotes.map((e) => (
						<div
							key={`${e.provider}-${e.id}`}
							className="flex flex-col items-center gap-1.5 rounded-md border border-border bg-card p-3"
						>
							{/* biome-ignore lint/performance/noImgElement: provider CDN */}
							<img
								src={e.url1x}
								srcSet={`${e.url1x} 1x, ${e.url2x} 2x`}
								alt={e.name}
								className="h-12 w-12 object-contain"
							/>
							<span className="truncate font-mono text-foreground text-xs">{e.name}</span>
							<span
								className={`rounded px-1.5 py-px font-mono text-[9px] uppercase tracking-wider ${PROVIDER_COLOR[e.provider] ?? ""}`}
							>
								{e.provider}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
