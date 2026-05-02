"use client";

// Centerpiece of the Stream dashboard. When offline: big "Provision +
// Go Live" button. When live: "End stream" button + viewer count. Both
// drive the existing stream.goLive / stream.stopLive mutations; the
// LIVE state itself comes from the channel.getInfo polling.

import { Button } from "@howlcast/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Radio, Square } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

const POLL_MS = 10_000;

export default function GoLiveCard() {
	const queryClient = useQueryClient();
	const live = useQuery({
		...trpc.stream.isLive.queryOptions(),
		refetchInterval: POLL_MS,
	});
	const credentials = useQuery({
		...trpc.stream.getStreamCredentials.queryOptions(),
		retry: false,
	});

	const isLive = !!live.data?.isLive;
	const hasCall = !!credentials.data?.callId;

	const provision = useMutation(
		trpc.channel.createCall.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.stream.getStreamCredentials.queryKey(),
				});
				toast.success("Stream provisioned. You can go live now.");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const goLive = useMutation(
		trpc.stream.goLive.mutationOptions({
			onSuccess: () => {
				toast.success("Going live.");
				queryClient.invalidateQueries({ queryKey: trpc.stream.isLive.queryKey() });
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const stopLive = useMutation(
		trpc.stream.stopLive.mutationOptions({
			onSuccess: () => {
				toast.success("Stream ended.");
				queryClient.invalidateQueries({ queryKey: trpc.stream.isLive.queryKey() });
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const busy = provision.isPending || goLive.isPending || stopLive.isPending;

	return (
		<section className="flex flex-col items-start gap-5 rounded-lg border border-border bg-card p-6 lg:flex-row lg:items-center lg:justify-between">
			<div className="flex items-center gap-4">
				<div
					className={`grid h-14 w-14 flex-none place-items-center rounded-full ${
						isLive ? "bg-[var(--live)]/20 text-live" : "bg-bg-3 text-fg-3"
					}`}
				>
					{isLive ? (
						<Radio className="h-6 w-6 animate-pulse" aria-hidden />
					) : (
						<Radio className="h-6 w-6" aria-hidden />
					)}
				</div>
				<div className="flex min-w-0 flex-col gap-1">
					<span className="font-display font-semibold text-foreground text-xl">
						{isLive ? "Live now" : "Off air"}
					</span>
					<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
						{isLive
							? formatDuration(live.data?.startedAt ?? null)
							: hasCall
								? "Stream provisioned · ready to go live"
								: "First broadcast — provision the GetStream call"}
					</span>
				</div>
			</div>

			<div className="flex items-center gap-3">
				{isLive ? (
					<>
						<span className="inline-flex items-center gap-1.5 rounded-md bg-bg-2 px-3 py-1.5 font-mono text-fg-2 text-sm">
							<Eye className="h-3.5 w-3.5" aria-hidden />—
						</span>
						<Button
							type="button"
							variant="destructive"
							onClick={() => stopLive.mutate()}
							disabled={busy}
						>
							<Square className="mr-1.5 h-4 w-4" aria-hidden />
							{stopLive.isPending ? "Ending…" : "End stream"}
						</Button>
					</>
				) : hasCall ? (
					<Button type="button" onClick={() => goLive.mutate()} disabled={busy}>
						<Radio className="mr-1.5 h-4 w-4" aria-hidden />
						{goLive.isPending ? "Going live…" : "Go live"}
					</Button>
				) : (
					<Button type="button" onClick={() => provision.mutate()} disabled={busy}>
						{provision.isPending ? "Provisioning…" : "Provision stream"}
					</Button>
				)}
			</div>
		</section>
	);
}

function formatDuration(startedAtMs: number | null): string {
	if (!startedAtMs) return "Live";
	const elapsed = Math.max(0, Date.now() - startedAtMs);
	const mins = Math.floor(elapsed / 60_000);
	const secs = Math.floor((elapsed % 60_000) / 1000);
	return `${mins}m ${secs.toString().padStart(2, "0")}s on air`;
}
