import SecuritySection from "@/components/auth/security-section";

export default function SecurityPage() {
	return (
		<main className="mx-auto w-full max-w-3xl px-6 py-12">
			<header className="mb-8">
				<h1 className="font-display font-semibold text-3xl text-foreground tracking-tight">
					Security
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Two-factor, passkeys, and active sessions.
				</p>
			</header>
			<SecuritySection />
		</main>
	);
}
