import { redirect } from "next/navigation";

import SetupWizard from "@/components/setup/setup-wizard";

export const metadata = {
	title: "Set up your den · HowlCast",
};

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000";

// First-run installer. Public — no session needed; the wizard creates the
// initial broadcaster account itself. Once setup has completed, the page
// redirects home so a re-visit can't trigger any commit attempt (the API
// already refuses, but stopping here is cleaner UX).
export default async function SetupPage() {
	const res = await fetch(`${SERVER_URL}/api/trpc/setup.getStatus`, { cache: "no-store" });
	if (res.ok) {
		const json = (await res.json()) as { result?: { data?: { setupCompleted?: boolean } } };
		if (json.result?.data?.setupCompleted) {
			redirect("/");
		}
	}

	return (
		<main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-12">
			<SetupWizard />
		</main>
	);
}
