"use client";

// RTMPS URL + masked stream key. The broadcaster's signed user JWT IS
// the OBS stream key (per docs/integrations/getstream.md). Show/hide
// toggle + Copy buttons. The URL is the GetStream RTMPS ingress.

import { Button } from "@howlcast/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, Radio } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export default function RtmpsCard() {
	const broadcaster = useQuery({
		...trpc.stream.getBroadcasterToken.queryOptions(),
		retry: false,
	});
	const [revealed, setRevealed] = useState(false);

	// Canonical URL comes from GetStream's `ingress.rtmp.address` field —
	// captured at provision time and persisted on channelConfig. Falsy
	// while the call hasn't been provisioned yet.
	const rtmpsUrl = broadcaster.data?.rtmpsUrl ?? "";
	const streamKey = broadcaster.data?.userToken ?? "";

	async function copy(value: string, label: string) {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(`${label} copied.`);
		} catch {
			toast.error("Couldn't copy to clipboard.");
		}
	}

	return (
		<section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
			<header className="flex items-center gap-2 border-border border-b pb-3">
				<Radio className="h-4 w-4 text-cyan" aria-hidden />
				<h2 className="font-display font-semibold text-foreground">OBS connection</h2>
			</header>

			<div className="flex flex-col gap-1.5">
				<span className="font-mono text-[10px] text-fg-3 uppercase tracking-wider">
					Server (RTMPS)
				</span>
				<div className="flex items-center gap-2 rounded-md border border-border bg-bg-2 px-3 py-2">
					<code className="min-w-0 flex-1 truncate font-mono text-foreground text-xs">
						{rtmpsUrl || "Not yet provisioned"}
					</code>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={() => copy(rtmpsUrl, "Server URL")}
						disabled={!rtmpsUrl}
						aria-label="Copy server URL"
					>
						<Copy className="h-3.5 w-3.5" aria-hidden />
					</Button>
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<span className="font-mono text-[10px] text-fg-3 uppercase tracking-wider">Stream key</span>
				<div className="flex items-center gap-2 rounded-md border border-border bg-bg-2 px-3 py-2">
					<code className="min-w-0 flex-1 truncate font-mono text-foreground text-xs">
						{streamKey ? (revealed ? streamKey : "•".repeat(40)) : "Not yet provisioned"}
					</code>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={() => setRevealed((v) => !v)}
						disabled={!streamKey}
						aria-label={revealed ? "Hide key" : "Reveal key"}
					>
						{revealed ? (
							<EyeOff className="h-3.5 w-3.5" aria-hidden />
						) : (
							<Eye className="h-3.5 w-3.5" aria-hidden />
						)}
					</Button>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={() => copy(streamKey, "Stream key")}
						disabled={!streamKey}
						aria-label="Copy stream key"
					>
						<Copy className="h-3.5 w-3.5" aria-hidden />
					</Button>
				</div>
				<p className="text-muted-foreground text-xs">
					Paste these into OBS Studio → Settings → Stream. Use service "Custom", not Twitch.
				</p>
			</div>
		</section>
	);
}
