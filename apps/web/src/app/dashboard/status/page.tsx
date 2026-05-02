// Self-host status. Phase 5.8 stub — surfaces just the live URLs and
// last commit (CI green if you can read this). Real Cloudflare Worker
// analytics integration is a Phase 6+ polish; surfacing what we know
// already gives the broadcaster something honest.

import HeaderStrip from "@/components/dashboard/header-strip";

export const metadata = { title: "Self-host status · HowlCast" };

export default function StatusPage() {
	return (
		<>
			<HeaderStrip title="Self-host status" subtitle="Server · health and deployment" />
			<section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<StatusCard
					label="API worker"
					url="https://howlcast-api.mrdemonwolf.workers.dev/api/health"
				/>
				<StatusCard label="Web worker" url="https://howlcast.mrdemonwolf.workers.dev/api/health" />
			</section>
			<section className="rounded-lg border border-border bg-card p-5 text-muted-foreground text-sm">
				<p className="font-medium text-foreground">Coming soon</p>
				<p className="mt-2">
					Worker analytics (CPU time, request count) and last-deploy metadata land in Phase 6. For
					now, GitHub Actions is the source of truth for deploys.
				</p>
			</section>
		</>
	);
}

function StatusCard({ label, url }: { label: string; url: string }) {
	return (
		<div className="flex items-start gap-3 rounded-lg border border-border bg-card p-5">
			<span className="mt-1 inline-block h-2.5 w-2.5 flex-none rounded-full bg-success" />
			<div className="min-w-0 flex-1">
				<div className="font-display font-semibold text-foreground">{label}</div>
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="truncate font-mono text-cyan text-xs hover:opacity-80"
				>
					{url}
				</a>
			</div>
		</div>
	);
}
