// Live → Stream landing. Stepped walkthrough so a first-time broadcaster
// has an obvious path from a fresh install to actually streaming:
//
//   1. Provision    → not provisioned yet (no streamCallId)
//   2. Connect OBS  → provisioned, not yet live (RTMPS card front-and-center)
//   3. Live now     → live (off-air controls hide, viewer count + End shown)
//
// Layout/auth guards live in dashboard/layout.tsx. The wizard stages
// derive from `stream.getStreamCredentials` (callId = provisioned) and
// `stream.isLive` (real GetStream state via webhook-updated DB column).

import HeaderStrip from "@/components/dashboard/header-strip";
import StreamWizard from "@/components/dashboard/stream/stream-wizard";

export const metadata = { title: "Stream · HowlCast" };

export default function DashboardPage() {
	return (
		<>
			<HeaderStrip title="Stream" subtitle="Set up · Connect OBS · Go live" />
			<StreamWizard />
		</>
	);
}
