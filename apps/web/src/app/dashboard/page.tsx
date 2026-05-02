// Live → Stream landing page. Provision call (one-time) → Go Live →
// End stream. RTMPS connection card + title/visibility editor side by
// side underneath. Layout/auth guards live in dashboard/layout.tsx.

import GoLiveCard from "@/components/dashboard/stream/go-live-card";
import RtmpsCard from "@/components/dashboard/stream/rtmps-card";
import TitleForm from "@/components/dashboard/stream/title-form";
import HeaderStrip from "@/components/dashboard/header-strip";

export const metadata = { title: "Stream · HowlCast" };

export default function DashboardPage() {
	return (
		<>
			<HeaderStrip title="Stream" subtitle="Provision · Go live · Edit details" />

			<GoLiveCard />

			<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
				<RtmpsCard />
				<TitleForm />
			</div>
		</>
	);
}
