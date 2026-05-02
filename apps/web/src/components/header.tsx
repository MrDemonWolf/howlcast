import Image from "next/image";
import Link from "next/link";

import UserMenu from "./user-menu";

export default function Header() {
	return (
		<header className="border-border border-b">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
				<Link href="/" className="flex items-center gap-2">
					<Image
						src="/logos/howlcast-mark.svg"
						alt="HowlCast"
						width={28}
						height={28}
						priority
					/>
					<span
						className="font-display font-semibold text-foreground text-lg tracking-tight"
						style={{ fontFamily: "var(--font-display)" }}
					>
						HowlCast
					</span>
				</Link>
				<nav className="flex items-center gap-6 text-sm">
					<Link
						href="/dashboard"
						className="text-muted-foreground hover:text-foreground"
					>
						Dashboard
					</Link>
					<UserMenu />
				</nav>
			</div>
		</header>
	);
}
