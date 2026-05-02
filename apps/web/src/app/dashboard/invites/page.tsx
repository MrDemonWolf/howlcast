import HeaderStrip from "@/components/dashboard/header-strip";
import InvitesPanel from "@/components/dashboard/invites/invites-panel";

export const metadata = { title: "Invites · HowlCast" };

export default function InvitesPage() {
	return (
		<>
			<HeaderStrip
				title="Invite emails"
				subtitle="Channel · single template, magic-link sign-in for viewers"
			/>
			<InvitesPanel />
		</>
	);
}
