"use client";

// Public top nav. Matches design v2 prototype's TopNav (chrome.jsx). Drops
// the design-time ThemeToggle because HowlCast is dark-only per
// DESIGN-DECISIONS.md. Right side shows either UserMenu (signed in) or
// "Sign in" (signed out).

import { BrandMark } from "@howlcast/ui/components/brand-mark";
import Image from "next/image";
import Link from "next/link";

import { useWhiteLabel } from "@/lib/use-white-label";
import UserMenu from "./user-menu";

export default function Header() {
	const wl = useWhiteLabel();

	return (
		<header
			className="sticky top-0 z-20 flex h-14 items-center justify-between border-border border-b bg-background px-6"
			data-slot="header"
		>
			<Link href="/" className="flex items-center gap-2.5" aria-label="Home">
				{wl.hasCustomLogo ? (
					<>
						<Image
							src={wl.logoUrl}
							alt={wl.platformName}
							width={22}
							height={22}
							className="h-[22px] w-[22px]"
							priority
						/>
						<span
							className="font-display font-bold"
							style={{ letterSpacing: "-0.02em", fontSize: 16 }}
						>
							{wl.platformName}
						</span>
					</>
				) : (
					<BrandMark size={22} brandName={wl.platformName} />
				)}
			</Link>
			<div className="flex items-center gap-1.5">
				<UserMenu />
			</div>
		</header>
	);
}
