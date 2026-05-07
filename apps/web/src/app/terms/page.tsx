import Link from "next/link";

export const metadata = {
	title: "Terms · HowlCast",
	description: "Acceptable use, content ownership, and dispute terms for HowlCast.",
};

const LAST_UPDATED = "2026-05-06";

export default function TermsPage() {
	return (
		<main className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
			<header className="mb-8 border-border border-b pb-6">
				<span className="font-mono text-[10px] text-cyan uppercase tracking-[0.2em]">Legal</span>
				<h1 className="mt-2 font-display font-semibold text-4xl text-foreground tracking-tight">
					Terms of Service
				</h1>
				<p className="mt-2 font-mono text-fg-3 text-xs uppercase tracking-wider">
					Version 1 · last updated {LAST_UPDATED}
				</p>
			</header>

			<article className="prose-sm flex flex-col gap-6 text-fg-2 text-sm leading-relaxed">
				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">Acceptance</h2>
					<p>
						By using HowlCast you agree to these terms. If you don't agree, don't use the service.
					</p>
				</section>

				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">
						Account and access
					</h2>
					<p>
						HowlCast is invite-only. The broadcaster controls who receives invites; viewers without
						an invite can watch but not post. You're responsible for keeping your sign-in
						credentials secure.
					</p>
				</section>

				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">
						Acceptable use
					</h2>
					<ul className="list-disc space-y-1 pl-5">
						<li>No harassment, hate speech, or threats targeting any person or group.</li>
						<li>No illegal content (CSAM, real violence, infringing material, etc.).</li>
						<li>No spam, scams, scraping, or automated abuse of the platform.</li>
						<li>
							No attempt to disrupt the service (DDoS, exploit probing without authorization).
						</li>
					</ul>
					<p className="mt-2">
						Violations get you banned from the channel and possibly removed from the service. Severe
						violations are reported to law enforcement.
					</p>
				</section>

				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">
						Content ownership
					</h2>
					<p>
						You keep the rights to anything you post. By posting in chat you grant HowlCast a
						non-exclusive license to display your messages within the channel for as long as the
						channel exists. HowlCast doesn't record, store, or redistribute the broadcaster's video
						stream — it's live-only.
					</p>
				</section>

				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">Moderation</h2>
					<p>
						The broadcaster has full moderation authority over chat and viewer access using
						GetStream's built-in tools (ban, mute, slow mode, profanity filter). Decisions are
						final.
					</p>
				</section>

				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">
						Service availability
					</h2>
					<p>
						HowlCast is provided "as is" with no uptime guarantee. We use Cloudflare and GetStream;
						outages in either may interrupt the service. We aren't liable for losses caused by
						downtime, missed streams, or chat unavailability.
					</p>
				</section>

				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">Termination</h2>
					<p>
						You can delete your account anytime by emailing{" "}
						<span className="font-mono">legal@mrdemonwolf.com</span>. We can suspend or terminate
						accounts that violate these terms.
					</p>
				</section>

				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">Changes</h2>
					<p>
						We may update these terms. Material changes are announced in the channel before they
						take effect. Continued use after changes means you accept the new terms.
					</p>
				</section>
			</article>

			<footer className="mt-10 flex justify-between border-border border-t pt-6 text-fg-3 text-xs">
				<Link href="/" className="hover:text-foreground">
					← Back to channel
				</Link>
				<Link href={"/privacy" as never} className="hover:text-foreground">
					Privacy Policy →
				</Link>
			</footer>
		</main>
	);
}
