"use client";

// Dashboard sidebar nav. Matches design-handoff/howcast-v2 prototype: three
// groups (CHANNEL / STREAM / SETTINGS), Streamer Mode toggle above the user
// chip footer, cyan dot to the left of the active item.

import { Avatar } from "@howlcast/ui/components/avatar";
import { BrandMark } from "@howlcast/ui/components/brand-mark";
import {
	Activity,
	BarChart3,
	Bell,
	Image as ImageIcon,
	Key,
	LayoutGrid,
	type LucideIcon,
	Mail,
	MessageSquare,
	Smile,
	UserCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useWhiteLabel } from "@/lib/use-white-label";
import { StreamerModeToggle } from "./streamer-mode-toggle";

type Item = { href: string; label: string; icon: LucideIcon };
type Section = { title: string; items: Item[] };

const SECTIONS: Section[] = [
	{
		title: "CHANNEL",
		items: [
			{ href: "/dashboard", label: "Overview", icon: Activity },
			{ href: "/dashboard/panels", label: "Panels", icon: LayoutGrid },
			{ href: "/dashboard/branding", label: "Branding", icon: ImageIcon },
		],
	},
	{
		title: "STREAM",
		items: [
			{ href: "/dashboard/status", label: "Status", icon: Activity },
			{ href: "/dashboard/stream-key", label: "Stream key", icon: Key },
			{ href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
			{ href: "/dashboard/emotes", label: "Emotes", icon: Smile },
			{ href: "/dashboard/stats", label: "Stats", icon: BarChart3 },
		],
	},
	{
		title: "SETTINGS",
		items: [
			{ href: "/dashboard/invites", label: "Invites", icon: Mail },
			{ href: "/dashboard/notifications", label: "Notifications", icon: Bell },
			{ href: "/dashboard/account", label: "Account", icon: UserCircle },
		],
	},
];

interface SidebarProps {
	displayName: string;
	verified: boolean;
}

export default function Sidebar({ displayName, verified: _verified }: SidebarProps) {
	const pathname = usePathname();
	const wl = useWhiteLabel();

	return (
		<aside
			className="sticky top-0 hidden h-svh w-60 flex-none flex-col gap-1 overflow-y-auto border-border border-r bg-background p-3 lg:flex"
			data-slot="dashboard-sidebar"
		>
			<div className="flex items-center justify-between px-2 pt-1.5 pb-4">
				<Link href="/" className="flex items-center gap-2.5" aria-label="Home">
					{wl.hasCustomLogo ? (
						<>
							{}
							<img
								src={wl.logoUrl}
								alt={wl.platformName}
								width={20}
								height={20}
								className="h-5 w-5"
							/>
							<span
								className="font-display font-bold text-base"
								style={{ letterSpacing: "-0.02em" }}
							>
								{wl.platformName}
							</span>
						</>
					) : (
						<BrandMark size={20} brandName={wl.platformName} />
					)}
				</Link>
			</div>

			<div className="scroll-y flex-1 pb-3">
				{SECTIONS.map((section) => (
					<div key={section.title} className="mb-4">
						<div className="eyebrow px-2.5 pb-2">{section.title}</div>
						<nav className="flex flex-col gap-px">
							{section.items.map((item) => {
								const active =
									pathname === item.href ||
									(item.href !== "/dashboard" && pathname.startsWith(item.href));
								const Icon = item.icon;
								return (
									<Link
										key={item.href}
										href={item.href as never}
										className="group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 font-medium text-[13px] transition"
										style={{
											background: active ? "var(--bg-3)" : "transparent",
											color: active ? "var(--fg)" : "var(--fg-3)",
											fontWeight: active ? 500 : 400,
										}}
										aria-current={active ? "page" : undefined}
									>
										{active && (
											<span
												aria-hidden
												className="-translate-y-1/2 absolute top-1/2 left-[-12px] h-1 w-1 rounded-full"
												style={{ background: "var(--cyan)" }}
											/>
										)}
										<Icon size={15} aria-hidden />
										{item.label}
									</Link>
								);
							})}
						</nav>
					</div>
				))}
			</div>

			<div className="border-border border-t pt-2.5 pb-1">
				<StreamerModeToggle />
			</div>
			<div className="flex items-center gap-2.5 px-2 pt-2.5 pb-1">
				<Avatar size={28} name={displayName || "WL"} hue={250} />
				<div className="min-w-0 flex-1">
					<div className="truncate font-medium text-[12px] leading-tight">{displayName}</div>
					<div className="text-[11px]" style={{ color: "var(--fg-4)" }}>
						Broadcaster · Owner
					</div>
				</div>
			</div>
		</aside>
	);
}
