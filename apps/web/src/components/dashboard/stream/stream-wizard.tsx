"use client";

// Stepped first-time broadcaster walkthrough. Three stages keyed off the
// real backend state — never trust local-only flags so a refresh resumes
// at the right step.
//
//   stage = "unprovisioned"  → no streamCallId yet  → big "Set up your stream"
//   stage = "ready"          → provisioned + offline → RTMPS card centered + Go Live
//   stage = "live"           → liveStartedAt set     → live indicator + End stream
//
// The RTMPS card and title editor stay visible after provisioning so the
// broadcaster can edit between streams without re-running the wizard.

import { Button } from "@howlcast/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Eye, Radio, Square, Sparkles } from "lucide-react";
import { toast } from "sonner";

import RtmpsCard from "@/components/dashboard/stream/rtmps-card";
import TitleForm from "@/components/dashboard/stream/title-form";
import { trpc } from "@/utils/trpc";

const POLL_MS = 10_000;

export default function StreamWizard() {
	const queryClient = useQueryClient();

	const credentials = useQuery({
		...trpc.stream.getStreamCredentials.queryOptions(),
		retry: false,
	});
	const live = useQuery({
		...trpc.stream.isLive.queryOptions(),
		refetchInterval: POLL_MS,
	});

	const isLive = !!live.data?.isLive;
	const hasCall = !!credentials.data?.callId;
	const stage: "unprovisioned" | "ready" | "live" = isLive
		? "live"
		: hasCall
			? "ready"
			: "unprovisioned";

	const provision = useMutation(
		trpc.stream.provision.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.stream.getStreamCredentials.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.stream.getBroadcasterToken.queryKey(),
				});
				toast.success("Stream provisioned. Copy the RTMPS details into OBS, then go live.");
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

	if (stage === "unprovisioned") {
		return (
			<section className="flex flex-col items-center gap-5 rounded-lg border border-cyan-soft bg-cyan-glow p-8 text-center">
				<div className="grid h-14 w-14 place-items-center rounded-full bg-cyan/15 text-cyan">
					<Sparkles className="h-6 w-6" aria-hidden />
				</div>
				<div className="flex max-w-md flex-col gap-2">
					<h2 className="font-display font-semibold text-foreground text-xl">Set up your stream</h2>
					<p className="text-muted-foreground text-sm">
						One-time. We'll create your livestream call on GetStream and pull back the RTMPS server
						URL OBS needs to push video.
					</p>
				</div>
				<Button type="button" onClick={() => provision.mutate()} disabled={busy} size="lg">
					{provision.isPending ? "Setting up…" : "Set up my stream"}
				</Button>
				<p className="text-fg-3 text-xs">
					Step 1 of 3 · You only do this once. After this, "Go live" works any time.
				</p>
			</section>
		);
	}

	if (stage === "live") {
		return (
			<>
				<section className="flex flex-col items-start gap-5 rounded-lg border border-[var(--live)]/30 bg-[var(--live)]/5 p-6 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex items-center gap-4">
						<div className="grid h-14 w-14 flex-none place-items-center rounded-full bg-[var(--live)]/20 text-live">
							<Radio className="h-6 w-6 animate-pulse" aria-hidden />
						</div>
						<div className="flex min-w-0 flex-col gap-1">
							<span className="font-display font-semibold text-foreground text-xl">
								You're live
							</span>
							<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
								{formatDuration(live.data?.startedAt ?? null)}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-3">
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
					</div>
				</section>
				<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
					<RtmpsCard />
					<TitleForm />
				</div>
			</>
		);
	}

	// stage === "ready" — provisioned, off air. RTMPS detail front and centre,
	// numbered steps so it's obvious copy-into-OBS comes before "Go live".
	return (
		<>
			<section className="flex flex-col items-start gap-5 rounded-lg border border-border bg-card p-6 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex items-center gap-4">
					<div className="grid h-14 w-14 flex-none place-items-center rounded-full bg-bg-3 text-fg-2">
						<CheckCircle2 className="h-6 w-6 text-cyan" aria-hidden />
					</div>
					<div className="flex min-w-0 flex-col gap-1">
						<span className="font-display font-semibold text-foreground text-xl">
							Stream is set up
						</span>
						<span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
							Step 2: Copy the RTMPS details into OBS · Step 3: Go live
						</span>
					</div>
				</div>
				<Button type="button" onClick={() => goLive.mutate()} disabled={busy} size="lg">
					<Radio className="mr-1.5 h-4 w-4" aria-hidden />
					{goLive.isPending ? "Going live…" : "Go live"}
				</Button>
			</section>
			{/* Escape hatch: if the GetStream webhook never fires (misconfigured URL,
			    delivery failure), the wizard stays stuck on "ready" even though
			    OBS may be pushing. Force-end calls stopLive on GetStream directly,
			    which lets the broadcaster recover without contacting support. */}
			<section className="flex items-center justify-between rounded-lg border border-border border-dashed bg-bg-2 px-4 py-3 text-muted-foreground text-xs">
				<span>Stream stuck or pushing without a Live badge? Force-end the call on GetStream.</span>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => stopLive.mutate()}
					disabled={busy}
					className="text-fg-2 hover:text-foreground"
				>
					<Square className="mr-1.5 h-3 w-3" aria-hidden />
					{stopLive.isPending ? "Ending…" : "Force end"}
				</Button>
			</section>
			<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
				<RtmpsCard />
				<TitleForm />
			</div>
		</>
	);
}

function formatDuration(startedAtMs: number | null): string {
	if (!startedAtMs) return "Live";
	const elapsed = Math.max(0, Date.now() - startedAtMs);
	const mins = Math.floor(elapsed / 60_000);
	const secs = Math.floor((elapsed % 60_000) / 1000);
	return `${mins}m ${secs.toString().padStart(2, "0")}s on air`;
}
