"use client";

import { DisplayHeading } from "@howlcast/ui/components/display-heading";
import Link from "next/link";

import { useWhiteLabel } from "@/lib/use-white-label";
import UserMenu from "./user-menu";

export default function Header() {
	const wl = useWhiteLabel();

	return (
		<header className="border-border border-b">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
				<Link href="/" className="flex items-center gap-2">
					{/* Plain <img> — custom logos live at arbitrary R2 keys and we
					    don't want to register every R2 host in next.config remote
					    patterns. SVG-first anyway. */}
					{}
					<img src={wl.logoUrl} alt={wl.platformName} width={28} height={28} className="h-7 w-7" />
					<DisplayHeading as="span" size="sm">
						{wl.platformName}
					</DisplayHeading>
				</Link>
				<nav className="flex items-center gap-6 text-sm">
					<Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
						Dashboard
					</Link>
					<UserMenu />
				</nav>
			</div>
		</header>
	);
}
