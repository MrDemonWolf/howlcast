"use client";

// Empty-state banner shown inside the player surface when the broadcaster
// is offline. Matches design v2 prototype's OfflineBanner copy.

import { Button } from "@howlcast/ui/components/button";
import { Eyebrow } from "@howlcast/ui/components/eyebrow";
import { Bell } from "lucide-react";

interface OfflineBannerProps {
	displayName: string | null;
}

export function OfflineBanner({ displayName }: OfflineBannerProps) {
	const name = displayName ?? "The broadcaster";
	return (
		<div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 p-6 text-center">
			<Eyebrow style={{ color: "var(--fg-4)" }}>STREAM IS OFFLINE</Eyebrow>
			<h2
				className="font-display font-bold"
				style={{
					fontSize: 36,
					margin: 0,
					letterSpacing: "-0.025em",
				}}
			>
				See you next time
			</h2>
			<p className="m-0 max-w-[380px] text-sm" style={{ color: "var(--fg-3)" }}>
				{name} isn't streaming right now. Turn on alerts and we'll ping your Discord the moment they
				go live.
			</p>
			<div className="mt-2 flex gap-2">
				<Button variant="secondary">
					<Bell aria-hidden />
					Alert me when live
				</Button>
				<Button variant="ghost">About the channel</Button>
			</div>
		</div>
	);
}
