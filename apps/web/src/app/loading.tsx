// Loading state — skeleton mirrors the Den layout (player + meta + 6
// panels + chat list) so the layout doesn't shift when content arrives.

export default function Loading() {
	return (
		<main className="grid flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
			<section className="px-4 py-6 lg:px-6">
				<div className="skel" style={{ paddingBottom: "56.25%", borderRadius: 14 }} />
				<div className="mt-4 flex items-center gap-4">
					<div className="skel" style={{ width: 56, height: 56, borderRadius: 999 }} />
					<div className="flex-1">
						<div className="skel" style={{ width: 220, height: 18 }} />
						<div className="skel mt-2" style={{ width: 360, height: 12 }} />
					</div>
				</div>
				<div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[0, 1, 2].map((i) => (
						<div
							key={i}
							className="rounded-[var(--radius-lg)] border p-[18px]"
							style={{
								background: "var(--bg-2)",
								borderColor: "var(--line)",
							}}
						>
							<div className="skel" style={{ width: 72, height: 10 }} />
							<div className="skel mt-3" style={{ width: "100%", height: 14 }} />
							<div className="skel mt-2" style={{ width: "85%", height: 14 }} />
							<div className="skel mt-2" style={{ width: "60%", height: 14 }} />
						</div>
					))}
				</div>
			</section>
			<aside className="p-3.5" style={{ borderLeft: "1px solid var(--line)" }}>
				<div className="skel" style={{ width: 100, height: 10 }} />
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="mt-3 flex gap-2">
						<div className="skel" style={{ width: 38, height: 10 }} />
						<div className="skel flex-1" style={{ height: 10 }} />
					</div>
				))}
			</aside>
		</main>
	);
}
