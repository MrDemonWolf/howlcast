"use client";

// Dashboard sidebar nav. Matches design-handoff/project/dash-shell.css
// structurally: brand, "Go live" pill, three sections (Live, Channel,
// Server). Icons from lucide; active route highlighted with a cyan bar.

import {
	Activity,
	BellRing,
	Image as ImageIcon,
	Key,
	LayoutGrid,
	type LucideIcon,
	Mail,
	MessageSquare,
	Server,
	Settings,
	Sliders,
	Sparkles,
	Tv,
	UserCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: LucideIcon; soon?: boolean };
type Section = { title: string; items: Item[] };

// `soon: true` items render as disabled with a "soon" pill so the roadmap
// is visible without 404-ing on click. Drop the flag once the page ships.
const SECTIONS: Section[] = [
	{
		title: "Live",
		items: [
			{ href: "/dashboard", label: "Stream", icon: Tv },
			{ href: "/dashboard/stats", label: "Stats", icon: Activity, soon: true },
		],
	},
	{
		title: "Channel",
		items: [
			{ href: "/dashboard/panels", label: "Panels", icon: LayoutGrid },
			{ href: "/dashboard/emotes", label: "Emotes", icon: Sparkles },
			{ href: "/dashboard/invites", label: "Invite emails", icon: Mail },
			{ href: "/dashboard/stream-key", label: "Stream key", icon: Key },
			{ href: "/dashboard/notifications", label: "Notifications", icon: BellRing },
			{ href: "/dashboard/chat", label: "Chat (OBS source)", icon: MessageSquare },
		],
	},
	{
		title: "Server",
		items: [
			{ href: "/dashboard/status", label: "Self-host status", icon: Server },
			{ href: "/dashboard/account", label: "Account", icon: UserCircle },
			{ href: "/dashboard/branding", label: "Branding", icon: ImageIcon, soon: true },
			{ href: "/dashboard/legal", label: "Privacy / TOS", icon: Sliders, soon: true },
		],
	},
];

export default function Sidebar({
	displayName,
	verified,
}: {
	displayName: string;
	verified: boolean;
}) {
	const pathname = usePathname();

	return (
		<aside className="sticky top-0 hidden h-svh w-60 flex-none flex-col gap-5 overflow-y-auto border-border border-r bg-bg p-4 lg:flex">
			<div className="flex items-center gap-2.5 border-border border-b pb-3">
				<div className="grid h-9 w-9 flex-none place-items-center rounded-md bg-cyan-soft font-display font-semibold text-fg uppercase">
					{displayName.charAt(0)}
				</div>
				<div className="flex min-w-0 flex-col leading-tight">
					<span className="flex items-center gap-1 truncate font-semibold text-foreground text-sm">
						{displayName}
						{verified ? (
							<span aria-label="verified" className="text-cyan">
								✓
							</span>
						) : null}
					</span>
					<span className="font-mono text-[10px] text-muted-foreground tracking-wider">
						BROADCASTER
					</span>
				</div>
			</div>

			{SECTIONS.map((section) => (
				<div key={section.title} className="flex flex-col gap-1">
					<div className="px-1.5 font-mono text-[10px] text-fg-4 uppercase tracking-wider">
						{section.title}
					</div>
					<nav className="flex flex-col gap-px">
						{section.items.map((item) => {
							const active =
								pathname === item.href ||
								(item.href !== "/dashboard" && pathname.startsWith(item.href));
							const Icon = item.icon;
							if (item.soon) {
								return (
									<span
										key={item.href}
										aria-disabled="true"
										className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-2 font-medium text-fg-3 text-sm"
										title="Coming soon"
									>
										<Icon className="h-3.5 w-3.5 flex-none text-fg-4" aria-hidden />
										<span className="opacity-70">{item.label}</span>
										<span className="ml-auto rounded bg-bg-2 px-1.5 py-0.5 font-mono text-[9px] text-fg-3 uppercase tracking-wider">
											soon
										</span>
									</span>
								);
							}
							return (
								<Link
									key={item.href}
									href={item.href as never}
									className={`group flex items-center gap-2.5 rounded-md px-2.5 py-2 font-medium text-sm transition ${
										active
											? "bg-bg-2 text-foreground"
											: "text-fg-2 hover:bg-bg-2 hover:text-foreground"
									}`}
								>
									{active ? (
										<span className="-ml-1 mr-1 block h-3.5 w-0.5 rounded bg-cyan" />
									) : null}
									<Icon
										className={`h-3.5 w-3.5 flex-none ${active ? "text-foreground" : "text-fg-3"}`}
										aria-hidden
									/>
									{item.label}
								</Link>
							);
						})}
					</nav>
				</div>
			))}

			<div className="mt-auto border-border border-t pt-3">
				<Link
					href="/account/security"
					className="flex items-center gap-2 rounded-md px-2.5 py-2 text-fg-3 text-sm hover:bg-bg-2 hover:text-foreground"
				>
					<Settings className="h-3.5 w-3.5" aria-hidden />
					Account security
				</Link>
			</div>
		</aside>
	);
}
