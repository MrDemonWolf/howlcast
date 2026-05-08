"use client";

// User menu — design v2 split: My account / Broadcaster dashboard / Security
// / Sign out. Uses the @howlcast/ui Avatar (gradient initials).

import { Avatar } from "@howlcast/ui/components/avatar";
import { Button } from "@howlcast/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@howlcast/ui/components/dropdown-menu";
import { Skeleton } from "@howlcast/ui/components/skeleton";
import { ChevronDown, LogOut, Settings, Shield, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Link href="/login">
				<Button variant="ghost">Sign in</Button>
			</Link>
		);
	}

	const name = session.user.name || session.user.email?.split("@")[0] || "WL";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" className="h-9 gap-2 pr-2.5 pl-1.5" aria-label="Open user menu" />
				}
			>
				<Avatar size={26} name={name} src={session.user.image ?? null} hue={250} />
				<ChevronDown size={14} aria-hidden />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" sideOffset={8} className="min-w-56 bg-card">
				<div className="px-2.5 py-2.5">
					<div className="font-medium text-sm">{name}</div>
					<div className="text-fg-3 text-xs">{session.user.email}</div>
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem onClick={() => router.push("/account")}>
						<User aria-hidden />
						My account
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => router.push("/dashboard")}>
						<Settings aria-hidden />
						Broadcaster dashboard
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => router.push("/account/security")}>
						<Shield aria-hidden />
						Security
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={() => {
						authClient.signOut({
							fetchOptions: {
								onSuccess: () => router.push("/"),
							},
						});
					}}
				>
					<LogOut aria-hidden />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
