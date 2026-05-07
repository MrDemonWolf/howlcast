import Link from "next/link";

export const metadata = { title: "Page not found · HowlCast" };

export default function NotFound() {
	return (
		<main className="grid min-h-[70svh] place-items-center px-4">
			<div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
				<span className="font-mono text-[10px] text-cyan uppercase tracking-[0.2em]">404</span>
				<h1 className="font-display font-semibold text-3xl text-foreground leading-tight tracking-tight">
					Off the trail.
				</h1>
				<p className="text-muted-foreground text-sm">
					This page doesn't exist or moved. Try heading back to the channel.
				</p>
				<Link
					href="/"
					className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-cyan px-4 py-2 font-medium text-bg text-sm hover:opacity-90"
				>
					Back to channel
				</Link>
			</div>
		</main>
	);
}
