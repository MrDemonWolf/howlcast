// Invite landing route. Renders the centred card directly — the card itself
// owns the BrandMark + halo avatar so the layout matches design v2's
// InvitePage exactly.

import InviteAccept from "@/components/auth/invite-accept";
import { PageContainer } from "@/components/layout";

export const metadata = { title: "Invite · HowlCast" };

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
	const { code } = await params;
	return (
		<PageContainer variant="narrow" className="flex min-h-svh flex-col justify-center py-12">
			<InviteAccept code={code} />
		</PageContainer>
	);
}
