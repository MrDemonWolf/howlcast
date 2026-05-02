import HeaderStrip from "@/components/dashboard/header-strip";
import WebhooksEditor from "@/components/dashboard/notifications/webhooks-editor";

export const metadata = { title: "Notifications · HowlCast" };

export default function NotificationsPage() {
	return (
		<>
			<HeaderStrip
				title="Notifications"
				subtitle="Channel · Discord webhooks fired on live start/end"
			/>
			<WebhooksEditor />
		</>
	);
}
