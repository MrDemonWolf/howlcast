import DashboardChat from "@/components/dashboard/chat/dashboard-chat";

export const metadata = { title: "Chat · HowlCast" };

// Chrome-free chat for OBS browser source or a second-window dock.
// Same component as the dashboard chat, just rendered without header
// or sidebar so it fits any window size cleanly.
export default function PopoutChatPage() {
	return (
		<main className="h-svh bg-bg p-2">
			<DashboardChat popoutOnly />
		</main>
	);
}
