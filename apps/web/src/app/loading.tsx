export default function Loading() {
	return (
		<main className="grid min-h-[60svh] place-items-center px-4">
			<div className="flex flex-col items-center gap-3 text-muted-foreground">
				<div
					className="h-6 w-6 animate-spin rounded-full border-2 border-cyan border-t-transparent"
					aria-hidden
				/>
				<span className="font-mono text-[10px] uppercase tracking-wider">Loading…</span>
			</div>
		</main>
	);
}
