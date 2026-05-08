// 404 — design v2 copy.

import { Button } from "@howlcast/ui/components/button";
import { Eyebrow } from "@howlcast/ui/components/eyebrow";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Page not found · HowlCast" };

export default function NotFound() {
	return (
		<main className="flex min-h-[70svh] flex-col items-center justify-center gap-1 px-6 text-center">
			<Eyebrow style={{ fontSize: 11 }}>404</Eyebrow>
			<h1
				className="font-display font-bold"
				style={{
					fontSize: 40,
					margin: "8px 0",
					letterSpacing: "-0.025em",
				}}
			>
				Path not found
			</h1>
			<p className="m-0 max-w-[380px] text-sm" style={{ color: "var(--fg-3)" }}>
				Whatever you were following ran cold here. The link might be old or the page may have moved.
			</p>
			<Link href="/" className="mt-4">
				<Button variant="ghost">
					<ArrowLeft aria-hidden /> Back home
				</Button>
			</Link>
		</main>
	);
}
