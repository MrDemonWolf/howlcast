import { PawPrint } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
	return (
		<main className="flex flex-col">
			<section className="flex flex-1 items-center justify-center px-6 py-24">
				<div className="flex max-w-xl flex-col items-center text-center">
					<Image
						src="/logos/howlcast-mark.svg"
						alt="HowlCast"
						width={72}
						height={72}
						priority
					/>
					<h1
						className="mt-6 font-display font-semibold text-4xl text-foreground tracking-tight sm:text-5xl"
						style={{ fontFamily: "var(--font-display)" }}
					>
						HowlCast
					</h1>
					<p className="mt-4 inline-flex items-center gap-2 text-base text-muted-foreground sm:text-lg">
						<PawPrint className="h-4 w-4 text-cyan" aria-hidden="true" />
						For the inner circle.
					</p>
					<div className="mt-10 flex items-center gap-3">
						<Link
							href="/login"
							className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm transition hover:opacity-90"
						>
							Sign in
						</Link>
						<Link
							href="/dashboard"
							className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 font-medium text-foreground text-sm transition hover:bg-accent"
						>
							Dashboard
						</Link>
					</div>
				</div>
			</section>
			<footer className="border-border border-t py-6 text-center text-muted-foreground text-xs">
				Powered by HowlCast by MrDemonWolf, Inc.
			</footer>
		</main>
	);
}
