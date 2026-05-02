import HeaderStrip from "@/components/dashboard/header-strip";
import DashboardChat from "@/components/dashboard/chat/dashboard-chat";

export const metadata = { title: "Chat · HowlCast" };

export default function DashboardChatPage() {
	return (
		<>
			<HeaderStrip title="Chat" subtitle="Channel · live moderator view + OBS popout" />
			<DashboardChat />
		</>
	);
}
