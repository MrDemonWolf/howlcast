"use client";

import { useEffect } from "react";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main className="grid min-h-[70svh] place-items-center px-4">
			<div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
				<span className="font-mono text-[10px] text-live uppercase tracking-[0.2em]">Error</span>
				<h1 className="font-display font-semibold text-3xl text-foreground leading-tight tracking-tight">
					Something went sideways.
				</h1>
				<p className="text-muted-foreground text-sm">
					An unexpected error happened. Try again — if it keeps failing, the broadcaster has been
					notified.
				</p>
				{error.digest ? (
					<code className="rounded bg-bg-2 px-2 py-1 font-mono text-[11px] text-fg-3">
						ref: {error.digest}
					</code>
				) : null}
				<button
					type="button"
					onClick={reset}
					className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-cyan px-4 py-2 font-medium text-bg text-sm hover:opacity-90"
				>
					Try again
				</button>
			</div>
		</main>
	);
}
