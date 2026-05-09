import {
	ArrowRight,
	Cloud,
	Lock,
	MessageSquare,
	Radio,
	Shield,
	Sparkles,
	Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { APP_URL, REPO_URL } from "@/lib/constants.ts";

function Copyright() {
	return <>{new Date().getFullYear()}</>;
}

// LIVE preview mock
function LiveMock() {
	return (
		<div className="hc-pulse-ring hc-card mx-auto w-full max-w-md">
			<div className="flex items-center gap-4">
				<div
					className="h-16 w-16 shrink-0 rounded-xl"
					style={{ background: "linear-gradient(135deg, #0FACED, #4cc4f0)" }}
					aria-hidden="true"
				/>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span
							className="inline-flex h-1.5 w-1.5 rounded-full"
							style={{ background: "#ff3b30" }}
							aria-hidden="true"
						/>
						<span className="hc-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--brand-500)]">
							LIVE · 12 watching
						</span>
					</div>
					<p className="hc-text-1 mt-1 truncate font-semibold">Late-night den</p>
					<p className="hc-text-2 truncate text-sm">For the inner circle.</p>
				</div>
			</div>
			<div
				className="mt-5 flex items-center justify-between border-t pt-4"
				style={{ borderColor: "var(--hairline)" }}
			>
				<div className="flex items-center gap-2">
					<span className="hc-pill">
						<Radio className="h-3 w-3" /> RTMPS
					</span>
					<span className="hc-pill">
						<MessageSquare className="h-3 w-3" /> Chat
					</span>
					<span className="hc-pill">
						<Lock className="h-3 w-3" /> Invite
					</span>
				</div>
			</div>
		</div>
	);
}

function SectionHead({
	eyebrow,
	title,
	sub,
	align = "center",
}: {
	eyebrow?: string;
	title: ReactNode;
	sub?: ReactNode;
	align?: "center" | "left";
}) {
	return (
		<div className={`max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}>
			{eyebrow ? (
				<p className="hc-text-brand mb-3 text-sm font-semibold tracking-tight">{eyebrow}</p>
			) : null}
			<h2 className="hc-display hc-text-1 text-4xl sm:text-5xl lg:text-6xl">{title}</h2>
			{sub ? <p className="hc-text-2 mt-5 text-lg leading-relaxed sm:text-xl">{sub}</p> : null}
		</div>
	);
}

export default function HomePage() {
	return (
		<main className="hc-font hc-bg-base">
			{/* HERO */}
			<section className="relative overflow-hidden">
				<div className="hc-hero-glow" aria-hidden="true" />
				<div className="relative z-10 px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
					<div className="mx-auto max-w-4xl text-center">
						<p className="hc-reveal hc-reveal-1 hc-text-brand mb-5 text-sm font-semibold">
							Self-hosted · Cloudflare-native · Open source
						</p>
						<h1 className="hc-reveal hc-reveal-1 hc-display hc-text-1 text-5xl sm:text-7xl lg:text-[5.5rem]">
							Run your own
							<br />
							<span className="hc-text-brand">private den.</span>
						</h1>
						<p className="hc-reveal hc-reveal-2 hc-text-2 mx-auto mt-7 max-w-2xl text-lg leading-relaxed sm:text-xl">
							HowlCast is a single-tenant invite-only live streaming platform. RTMPS via GetStream,
							chat with 7TV emotes, two Discord webhooks, no public mode. Fits the Cloudflare free
							tier.
						</p>
						<div className="hc-reveal hc-reveal-3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
							<Link href="/docs/getting-started/quickstart" className="hc-btn hc-btn-primary">
								<Sparkles className="h-4 w-4" />
								Quickstart
							</Link>
							<Link href="/docs" className="hc-btn hc-btn-secondary">
								Read the docs
								<ArrowRight className="h-4 w-4" />
							</Link>
						</div>
						<p className="hc-text-2 mt-5 text-sm">
							Free Cloudflare tier · One broadcaster · No ads
						</p>
					</div>

					<div className="hc-reveal hc-reveal-3 mt-16 sm:mt-20">
						<LiveMock />
					</div>
				</div>
			</section>

			{/* AUDIENCES */}
			<section className="hc-bg-surface px-6 py-24 sm:py-32">
				<div className="mx-auto max-w-6xl">
					<SectionHead
						eyebrow="Built for"
						title={<>Three crowds. One den.</>}
						sub="Whether you stream weekly, host community calls, or fork the whole stack — HowlCast fits."
					/>

					<div className="mt-14 grid gap-5 md:grid-cols-3">
						{[
							{
								icon: Radio,
								title: "For broadcasters",
								body: "OBS pushes RTMPS to GetStream. Channel page picks up the stream automatically. Stats, chat, panels — all in one dashboard.",
								href: "/docs/operate/going-live",
								cta: "Going live",
							},
							{
								icon: Users,
								title: "For invited viewers",
								body: "Magic-link invite, click, watch + chat. No tier, no sub, no public-mode lottery. The den or nothing.",
								href: "/docs/operate/invites",
								cta: "How invites work",
							},
							{
								icon: Cloud,
								title: "For self-hosters",
								body: "Two Cloudflare Workers, one D1, two R2 buckets, one KV. Free tier covers it. Alchemy provisions everything in one command.",
								href: "/docs/deploy/cloudflare-setup",
								cta: "Deploy guide",
							},
						].map(({ icon: Icon, title, body, href, cta }) => (
							<div
								key={title}
								className="hc-card hc-card-hover hc-bg-base flex flex-col"
								style={{ border: "1px solid var(--hairline)" }}
							>
								<div
									className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
									style={{
										backgroundColor: "var(--brand-50)",
										color: "var(--brand-500)",
									}}
								>
									<Icon className="h-5 w-5" />
								</div>
								<h3 className="hc-display hc-text-1 mb-2 text-xl">{title}</h3>
								<p className="hc-text-2 flex-1 text-base leading-relaxed">{body}</p>
								<Link
									href={href as never}
									className="hc-text-brand mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
								>
									{cta}
									<ArrowRight className="h-3.5 w-3.5" />
								</Link>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CHAT */}
			<section className="hc-bg-base px-6 py-24 sm:py-32">
				<div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 lg:gap-16">
					<div>
						<p className="hc-text-brand mb-3 text-sm font-semibold">Chat that knows the den</p>
						<h2 className="hc-display hc-text-1 text-4xl sm:text-5xl">Real chat, real emotes.</h2>
						<p className="hc-text-2 mt-5 text-lg leading-relaxed">
							GetStream Chat with <code className="hc-mono hc-text-1">7TV</code>,{" "}
							<code className="hc-mono hc-text-1">BTTV</code>,{" "}
							<code className="hc-mono hc-text-1">FFZ</code>, and Twitch emotes pulled in via a
							12-hour cron. Chat works for the broadcaster + invited viewers; signed-out folks see
							the messages but can't post.
						</p>
						<Link
							href="/docs/configure/twitch-emotes"
							className="hc-text-brand mt-6 inline-flex items-center gap-1.5 text-sm font-semibold"
						>
							Emote pipeline reference
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</div>

					<div className="hc-card hc-bg-surface space-y-3 text-sm" aria-label="Chat preview">
						<div className="flex gap-2">
							<span className="font-semibold text-[var(--brand-500)]">broadcaster</span>
							<span className="hc-text-2">welcome to the den</span>
						</div>
						<div className="flex gap-2">
							<span className="font-semibold" style={{ color: "#a78bfa" }}>
								quietsleeper
							</span>
							<span className="hc-text-1">yo Pog Pog Pog</span>
						</div>
						<div className="flex gap-2">
							<span className="font-semibold" style={{ color: "#fb923c" }}>
								mossbuilder
							</span>
							<span className="hc-text-1">how's the new layout feel</span>
						</div>
						<div className="flex gap-2">
							<span className="font-semibold text-[var(--brand-500)]">broadcaster</span>
							<span className="hc-text-1">honestly? clean</span>
						</div>
					</div>
				</div>
			</section>

			{/* INVITE-ONLY */}
			<section className="hc-bg-surface px-6 py-24 sm:py-32">
				<div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 lg:gap-16">
					<div
						className="hc-card hc-bg-base order-2 md:order-1"
						style={{ border: "1px solid var(--hairline)" }}
					>
						<p className="hc-mono hc-text-2 mb-3 text-xs">PRIVATE STREAM INVITE</p>
						<div className="flex items-center gap-3">
							<div
								className="h-12 w-12 shrink-0 rounded-lg"
								style={{ background: "linear-gradient(135deg, #0FACED, #091533)" }}
								aria-hidden="true"
							/>
							<div className="min-w-0 flex-1">
								<p className="hc-text-1 truncate font-semibold">You're invited.</p>
								<p className="hc-text-2 truncate text-sm">Click to accept · expires in 30 days</p>
							</div>
						</div>
						<div className="mt-5 flex justify-end">
							<span className="hc-btn hc-btn-primary text-sm">Accept invite</span>
						</div>
					</div>

					<div className="order-1 md:order-2">
						<p className="hc-text-brand mb-3 text-sm font-semibold">Invite-only by design</p>
						<h2 className="hc-display hc-text-1 text-4xl sm:text-5xl">No public mode. Ever.</h2>
						<p className="hc-text-2 mt-5 text-lg leading-relaxed">
							Single boolean per profile (<code className="hc-mono hc-text-1">isInvited</code>).
							Magic-link emails. 30-day expiry. No tiers, no subscriber loops, no algorithm. Either
							you got the email or you didn't.
						</p>
						<Link
							href="/docs/operate/invites"
							className="hc-text-brand mt-6 inline-flex items-center gap-1.5 text-sm font-semibold"
						>
							Invite mechanics
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</div>
				</div>
			</section>

			{/* SELF-HOSTERS */}
			<section className="hc-bg-base px-6 py-24 sm:py-32">
				<div className="mx-auto max-w-5xl">
					<SectionHead
						eyebrow="For self-hosters"
						title={<>One command. Everything provisioned.</>}
						sub={
							<>
								Alchemy declares Cloudflare resources in TypeScript.{" "}
								<code className="hc-mono hc-text-1">bun run deploy</code> creates the Workers, D1,
								R2 buckets, KV, and crons. Re-running converges to the spec — idempotent.
							</>
						}
					/>

					<div className="mt-12">
						<pre
							className="hc-code"
							dangerouslySetInnerHTML={{
								__html: `<span style="color: var(--txt-2)"># clone, install, deploy</span>
git clone https://github.com/MrDemonWolf/howlcast.git
cd howlcast
bun install
<span style="color: var(--brand-500)">bun run deploy</span>

<span style="color: var(--txt-2)"># apply migrations to remote D1</span>
<span style="color: var(--brand-500)">bun run db:migrate:remote</span>`,
							}}
						/>
					</div>

					<div className="mt-10 flex flex-wrap items-center justify-center gap-3">
						<Link href="/docs/reference/architecture" className="hc-btn hc-btn-ghost">
							Architecture
						</Link>
						<Link href="/docs/reference/schema" className="hc-btn hc-btn-ghost">
							Database schema
						</Link>
						<Link href="/docs/reference/env-vars" className="hc-btn hc-btn-ghost">
							Env vars
						</Link>
						<a
							href={REPO_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="hc-btn hc-btn-ghost"
						>
							<svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
								<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
							</svg>
							GitHub
						</a>
					</div>
				</div>
			</section>

			{/* PRIVACY */}
			<section className="hc-bg-surface px-6 py-24 sm:py-32">
				<div className="mx-auto max-w-3xl text-center">
					<div
						className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
						style={{
							backgroundColor: "var(--brand-50)",
							color: "var(--brand-500)",
						}}
					>
						<Shield className="h-5 w-5" />
					</div>
					<h2 className="hc-display hc-text-1 text-4xl sm:text-5xl">No third-party analytics.</h2>
					<p className="hc-text-2 mt-5 text-lg leading-relaxed">
						Per-session viewer + chat counts come straight from GetStream webhooks into your D1. No
						GA, no Cloudflare Web Analytics, no third-party telemetry. Charts render off your own
						data.
					</p>
					<div className="mt-8 flex flex-wrap items-center justify-center gap-2">
						{["Self-hosted", "GDPR-friendly", "No telemetry", "Open source"].map((label) => (
							<span key={label} className="hc-pill">
								{label}
							</span>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="hc-bg-base px-6 py-28 sm:py-36">
				<div className="mx-auto max-w-4xl text-center">
					<div
						className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
						style={{
							backgroundColor: "var(--brand-50)",
							color: "var(--brand-500)",
						}}
					>
						<Radio className="h-5 w-5" />
					</div>
					<h2 className="hc-display hc-text-1 text-5xl sm:text-6xl lg:text-7xl">
						Push to your den.
						<br />
						<span className="hc-text-brand">Your friends only.</span>
					</h2>
					<div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
						<Link href="/docs/getting-started/quickstart" className="hc-btn hc-btn-primary">
							<Sparkles className="h-4 w-4" />
							30-min quickstart
						</Link>
						<Link href={APP_URL} className="hc-btn hc-btn-secondary">
							See it live
							<ArrowRight className="h-4 w-4" />
						</Link>
					</div>
					<p className="hc-text-2 mt-5 text-sm">
						Free Cloudflare tier · GetStream paid above N viewers
					</p>
				</div>
			</section>

			{/* FOOTER */}
			<footer
				className="hc-bg-surface px-6 py-10 text-center text-sm"
				style={{ borderTop: "1px solid var(--hairline)" }}
			>
				<p className="hc-text-2">
					&copy; <Copyright /> HowlCast by{" "}
					<Link
						href="https://www.mrdemonwolf.com"
						className="hc-text-1 transition-colors hover:underline"
					>
						MrDemonWolf, Inc.
					</Link>
				</p>
				<div className="hc-text-2 mt-2 flex items-center justify-center gap-1">
					<Link href={`${APP_URL}/privacy`} className="transition-colors hover:underline">
						Privacy Policy
					</Link>
					<span>·</span>
					<Link href={`${APP_URL}/terms`} className="transition-colors hover:underline">
						Terms of Service
					</Link>
				</div>
			</footer>
		</main>
	);
}
