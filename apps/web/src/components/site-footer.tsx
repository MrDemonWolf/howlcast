"use client";

// Site-wide footer. Renders /privacy + /terms links and the configurable
// "Powered by" attribution from the white_label table.

import Link from "next/link";

import { useWhiteLabel } from "@/lib/use-white-label";

export default function SiteFooter() {
	const wl = useWhiteLabel();
	const attribution =
		wl.footerAttribution === "custom"
			? wl.customFooterText
			: wl.footerAttribution === "default"
				? `Powered by ${wl.platformName} by MrDemonWolf, Inc.`
				: null;

	return (
		<footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-border border-t pt-5 font-mono text-[10px] text-fg-4 uppercase tracking-wider">
			<span>{attribution ?? " "}</span>
			<div className="flex gap-4">
				<Link href={"/privacy" as never} className="hover:text-foreground">
					Privacy
				</Link>
				<Link href={"/terms" as never} className="hover:text-foreground">
					Terms
				</Link>
			</div>
		</footer>
	);
}
