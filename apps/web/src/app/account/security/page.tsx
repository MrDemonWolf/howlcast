import { DisplayHeading } from "@howlcast/ui/components/display-heading";

import SecuritySection from "@/components/auth/security-section";

export default function SecurityPage() {
	return (
		<main className="mx-auto w-full max-w-3xl px-6 py-12">
			<header className="mb-8">
				<DisplayHeading size="lg">Security</DisplayHeading>
				<p className="mt-1 text-muted-foreground text-sm">
					Two-factor, passkeys, and active sessions.
				</p>
			</header>
			<SecuritySection />
		</main>
	);
}
