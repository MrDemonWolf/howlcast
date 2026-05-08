// Invite landing route. Renders the centred card directly — the card itself
// owns the BrandMark + halo avatar so the layout matches design v2's
// InvitePage exactly.

import InviteAccept from "@/components/auth/invite-accept";

export const metadata = { title: "Invite · HowlCast" };

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
	const { code } = await params;
	return (
		<main className="flex min-h-svh flex-col">
			<div className="flex flex-1 items-center justify-center px-6 py-12">
				<InviteAccept code={code} />
			</div>
		</main>
	);
}
