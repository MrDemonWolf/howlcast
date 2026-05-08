"use client";

// Signed-out landing for invite-only streams. Big halo avatar, lock eyebrow,
// two-CTA card (Sign in / I have an invite code). Matches design v2
// prototype's PrivateGate (pages-public.jsx).

import { Avatar } from "@howlcast/ui/components/avatar";
import { Button } from "@howlcast/ui/components/button";
import { Eyebrow } from "@howlcast/ui/components/eyebrow";
import { Lock } from "lucide-react";
import Link from "next/link";

import { useWhiteLabel } from "@/lib/use-white-label";

interface PrivateGateProps {
	displayName: string | null;
	avatarUrl?: string | null;
	isLive: boolean;
}

export function PrivateGate({ displayName, avatarUrl, isLive }: PrivateGateProps) {
	const wl = useWhiteLabel();
	const broadcaster = displayName ?? wl.platformName ?? "the broadcaster";

	return (
		<div className="flex flex-1 flex-col">
			<div className="flex flex-1 items-center justify-center p-6">
				<div className="flex w-full max-w-[460px] flex-col items-center gap-4 text-center">
					<Avatar
						size={88}
						name={broadcaster}
						src={avatarUrl ?? null}
						halo
						live={isLive}
						hue={252}
					/>
					<Eyebrow className="inline-flex items-center gap-1.5">
						<Lock size={11} strokeWidth={2} aria-hidden />
						PRIVATE STREAM · INVITE-ONLY
					</Eyebrow>
					<h1
						className="font-display font-bold"
						style={{
							fontSize: 32,
							margin: 0,
							letterSpacing: "-0.025em",
							lineHeight: 1.15,
						}}
					>
						This stream is invite-only
					</h1>
					<p className="m-0 max-w-[380px] text-sm leading-relaxed" style={{ color: "var(--fg-3)" }}>
						{isLive
							? `${broadcaster} is live right now, but only people on the invite list can watch. Sign in if you already have an account, or paste your invite code below.`
							: `Only people invited by ${broadcaster} can watch and chat here. Sign in if you've been here before, or paste the invite code they sent you.`}
					</p>
					<div
						className="mt-1.5 w-full rounded-[var(--radius-lg)] border bg-[var(--bg-2)] p-4"
						style={{ borderColor: "var(--line)" }}
					>
						<div className="flex gap-2">
							<Link href="/login" className="flex-1">
								<Button className="w-full">Sign in</Button>
							</Link>
							<Link href="/login?tab=invite" className="flex-1">
								<Button variant="secondary" className="w-full">
									I have an invite code
								</Button>
							</Link>
						</div>
						<div className="mt-3.5 text-xs leading-relaxed" style={{ color: "var(--fg-4)" }}>
							Don't have a code? Only {broadcaster} can send invites — reach out to them directly.
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
