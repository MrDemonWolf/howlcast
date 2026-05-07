"use client";

import { useEffect } from "react";

export default function DashboardError({
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
		<div className="flex min-h-[60svh] flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-8 text-center">
			<span className="font-mono text-[10px] text-live uppercase tracking-[0.2em]">
				Dashboard error
			</span>
			<h2 className="font-display font-semibold text-2xl text-foreground">
				This page failed to load.
			</h2>
			<p className="max-w-md text-muted-foreground text-sm">
				The rest of the dashboard is fine — only this page crashed. Try again, or pick a different
				page from the sidebar.
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
	);
}
