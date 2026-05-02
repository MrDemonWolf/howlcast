import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import SetupWizard from "@/components/setup/setup-wizard";

export const metadata = {
	title: "Set up your den · HowlCast",
};

// First-run setup. Wraps the client wizard with a session gate. Setup-status
// gate runs on the client (the wizard's `commit` mutation will refuse if it's
// already done) — keeping this page server-side simple for the cold path.
export default async function SetupPage() {
	const session = await authClient.getSession({
		fetchOptions: { headers: await headers() },
	});

	if (!session?.data?.user) {
		redirect("/login");
	}

	return (
		<main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-12">
			<SetupWizard />
		</main>
	);
}
