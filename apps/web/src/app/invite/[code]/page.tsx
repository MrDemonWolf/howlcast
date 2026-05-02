import Image from "next/image";

import InviteAccept from "@/components/auth/invite-accept";

export const metadata = { title: "Invite · HowlCast" };

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
	const { code } = await params;
	return (
		<main className="mx-auto flex min-h-svh w-full max-w-md flex-col px-6 py-12">
			<div className="mb-10 flex flex-col items-center gap-3">
				<Image src="/logos/howlcast-mark.svg" alt="" width={40} height={40} priority aria-hidden />
			</div>
			<div className="flex flex-1 items-start justify-center">
				<InviteAccept code={code} />
			</div>
		</main>
	);
}
