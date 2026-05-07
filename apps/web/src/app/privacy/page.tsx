import Link from "next/link";

export const metadata = {
	title: "Privacy · HowlCast",
	description: "How HowlCast collects, uses, and protects your data.",
};

const LAST_UPDATED = "2026-05-06";

export default function PrivacyPage() {
	return (
		<main className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
			<header className="mb-8 border-border border-b pb-6">
				<span className="font-mono text-[10px] text-cyan uppercase tracking-[0.2em]">Legal</span>
				<h1 className="mt-2 font-display font-semibold text-4xl text-foreground tracking-tight">
					Privacy Policy
				</h1>
				<p className="mt-2 font-mono text-fg-3 text-xs uppercase tracking-wider">
					Version 1 · last updated {LAST_UPDATED}
				</p>
			</header>

			<article className="prose-sm flex flex-col gap-6 text-fg-2 text-sm leading-relaxed">
				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">Operator</h2>
					<p>
						HowlCast is operated by <strong className="text-foreground">MrDemonWolf, Inc.</strong>{" "}
						("we", "us"). Contact: <span className="font-mono">legal@mrdemonwolf.com</span>.
					</p>
				</section>

				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">
						What we collect
					</h2>
					<ul className="list-disc space-y-1 pl-5">
						<li>Account: email, display name, username, hashed password.</li>
						<li>Auth: passkeys (public keys only), 2FA secrets, session cookies.</li>
						<li>Chat: messages you send via the embedded chat (stored by GetStream).</li>
						<li>Stream metadata: when streams started/ended, total minutes (no recordings).</li>
						<li>Operational logs: IP, user agent, request paths — kept ≤ 30 days.</li>
					</ul>
				</section>

				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">
						What we don't collect
					</h2>
					<ul className="list-disc space-y-1 pl-5">
						<li>No video recordings. HowlCast is live-only, no VODs.</li>
						<li>No third-party trackers, ad networks, or behavioural analytics.</li>
						<li>No payment data — HowlCast is invite-only and free to viewers.</li>
					</ul>
				</section>

				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">
						Sub-processors
					</h2>
					<p className="mb-2">
						HowlCast relies on the following third-party services to operate. Each acts as a
						sub-processor of your data:
					</p>
					<ul className="list-disc space-y-1 pl-5">
						<li>
							<strong className="text-foreground">Cloudflare</strong> — hosting, DNS, edge compute,
							D1 database (data stored in Cloudflare's global network).
						</li>
						<li>
							<strong className="text-foreground">GetStream</strong> — live video transport, chat
							messaging, moderation tools.
						</li>
						<li>
							<strong className="text-foreground">Resend</strong> — magic-link and invite email
							delivery.
						</li>
						<li>
							<strong className="text-foreground">Twitch Helix</strong> — read-only emote and
							channel lookup at setup time.
						</li>
					</ul>
				</section>

				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">Your rights</h2>
					<p>
						You can request a copy of your data, correct it, or have it deleted by emailing{" "}
						<span className="font-mono">legal@mrdemonwolf.com</span>. Account deletion removes your
						profile, sessions, and chat identity within 30 days.
					</p>
				</section>

				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">Cookies</h2>
					<p>
						HowlCast uses one essential cookie to keep you signed in. No advertising cookies, no
						cross-site tracking. The cookie is scoped to{" "}
						<span className="font-mono">.howlcast.tv</span> (or its current operating domain).
					</p>
				</section>

				<section>
					<h2 className="mb-2 font-display font-semibold text-foreground text-lg">Changes</h2>
					<p>
						This policy may change. Material changes are announced in the channel before they take
						effect. The "version" header above is bumped each time.
					</p>
				</section>
			</article>

			<footer className="mt-10 flex justify-between border-border border-t pt-6 text-fg-3 text-xs">
				<Link href="/" className="hover:text-foreground">
					← Back to channel
				</Link>
				<Link href={"/terms" as never} className="hover:text-foreground">
					Terms of Service →
				</Link>
			</footer>
		</main>
	);
}
