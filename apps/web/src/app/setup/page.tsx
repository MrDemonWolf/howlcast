// First-run installer. Public — no session needed; the wizard creates the
// initial broadcaster account itself. Once setup has completed, the page
// redirects home so a re-visit can't trigger any commit attempt (the API
// already refuses, but stopping here is cleaner UX).
//
// Layout matches design v2 prototype's SetupPage shell: BrandMark up top,
// stepper inside the wizard, mono footer.

import { BrandMark } from "@howlcast/ui/components/brand-mark";
import { redirect } from "next/navigation";

import SetupWizard from "@/components/setup/setup-wizard";

export const metadata = {
	title: "Set up your den · HowlCast",
};

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000";

export default async function SetupPage() {
	const res = await fetch(`${SERVER_URL}/api/trpc/setup.getStatus`, {
		cache: "no-store",
	});
	if (res.ok) {
		const json = (await res.json()) as {
			result?: { data?: { setupCompleted?: boolean } };
		};
		if (json.result?.data?.setupCompleted) {
			redirect("/");
		}
	}

	return (
		<main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-6 py-10">
			<div className="mb-10 flex flex-col items-center gap-3">
				<BrandMark size={28} />
				<div className="text-center">
					<h1
						className="font-display font-bold text-2xl"
						style={{ letterSpacing: "-0.022em", margin: 0 }}
					>
						Set up your den
					</h1>
					<p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--fg-3)" }}>
						One-time setup. We pull what we can from Twitch.
					</p>
				</div>
			</div>

			<div className="flex flex-1 items-start justify-center">
				<SetupWizard />
			</div>

			<footer className="eyebrow mt-10 text-center" style={{ color: "var(--fg-4)" }}>
				HOWLCAST · SELF-HOSTED ON CLOUDFLARE
			</footer>
		</main>
	);
}
