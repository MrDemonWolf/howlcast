"use client";

// Global error boundary — design v2 copy.

import { Button } from "@howlcast/ui/components/button";
import { Eyebrow } from "@howlcast/ui/components/eyebrow";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main className="flex min-h-[70svh] flex-col items-center justify-center gap-1 px-6 text-center">
			<Eyebrow style={{ fontSize: 11, color: "var(--destructive)" }}>500</Eyebrow>
			<h1
				className="font-display font-bold"
				style={{
					fontSize: 40,
					margin: "8px 0",
					letterSpacing: "-0.025em",
				}}
			>
				Something broke
			</h1>
			<p className="m-0 max-w-[380px] text-sm" style={{ color: "var(--fg-3)" }}>
				We've logged the error. Try again — if it keeps happening, ping the broadcaster's Discord.
			</p>
			{error.digest && (
				<div
					className="mt-2 text-[11px]"
					style={{
						fontFamily: "var(--font-mono)",
						color: "var(--fg-4)",
					}}
				>
					ref · {error.digest}
				</div>
			)}
			<div className="mt-4 flex gap-2">
				<Button onClick={reset}>
					<RefreshCw aria-hidden /> Reset
				</Button>
				<Link href="/">
					<Button variant="ghost">Back home</Button>
				</Link>
			</div>
		</main>
	);
}
