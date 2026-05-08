// Dashboard overview. Stat tiles up top, stream wizard (provision → connect
// OBS → go live) below. Layout/auth guards live in dashboard/layout.tsx.

import HeaderStrip from "@/components/dashboard/header-strip";
import { DashboardOverview } from "@/components/dashboard/overview";
import StreamWizard from "@/components/dashboard/stream/stream-wizard";

export const metadata = { title: "Overview · HowlCast" };

export default function DashboardPage() {
	return (
		<>
			<HeaderStrip
				title="Overview"
				subtitle="A quick look at your channel — go live below."
				eyebrow="DASHBOARD"
			/>
			<DashboardOverview />
			<div className="mt-8">
				<StreamWizard />
			</div>
		</>
	);
}
