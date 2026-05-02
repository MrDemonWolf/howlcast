// Dashboard landing — Live → Stream stub for Phase 5.1. Phase 5.2 fills
// this in with the Go Live button + RTMPS URL + animated counters.
// Layout/auth guards live in dashboard/layout.tsx.

import HeaderStrip from "@/components/dashboard/header-strip";

export const metadata = { title: "Dashboard · HowlCast" };

export default function DashboardPage() {
	return (
		<>
			<HeaderStrip title="Stream" subtitle="Live · go on air, configure visibility" />

			<section className="rounded-lg border border-border bg-card p-6">
				<h2 className="font-display font-semibold text-foreground text-lg">Coming up next</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					Phase 5.2 lands here: Go Live button, public/private toggle, RTMPS URL + stream key for
					OBS, animated viewer counter. The shell + role-gated middleware are in place.
				</p>
			</section>
		</>
	);
}
