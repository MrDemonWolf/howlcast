// First-run installer. Public — no session needed; the wizard creates the
// initial broadcaster account itself. Setup-completed redirect happens
// client-side inside <SetupWizard /> via the same tRPC client used elsewhere
// (avoids unreliable Worker→Worker subrequests during SSR).
//
// Layout matches design v2 prototype's SetupPage shell: BrandMark up top,
// stepper inside the wizard, mono footer.

import { BrandMark } from "@howlcast/ui/components/brand-mark";

import SetupWizard from "@/components/setup/setup-wizard";

export const metadata = {
	title: "Set up your den · HowlCast",
};

export default function SetupPage() {
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
