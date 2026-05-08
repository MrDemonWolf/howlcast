"use client";

// First-run setup wizard. Two steps in one page (state machine):
//   1. Twitch lookup — username -> Helix profile + emote-provider probe
//   2. Account     — email + password (creates the broadcaster login)
//
// On commit the server creates the user (signUpEmail), writes the
// broadcaster profile + channelConfig, and sets the session cookie.
// Client redirects to /dashboard signed-in. HowlCast is invite-only by
// design — no visibility selector, every den is private.
//
// UX rules applied:
//   - One primary action per step, "Step N of 2 · Label" indicator
//   - Inline errors (red strip under input), not just toasts
//   - Recap card prominent on step 2; account form below
//   - Password strength meter (4 segments, length+char-class basis)
//   - Final commit shows a brief "Welcome to the den" success state

import { Button } from "@howlcast/ui/components/button";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Check, Eye, PawPrint, Tv } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type LookupResult = {
	user: {
		id: string;
		login: string;
		displayName: string;
		profileImageUrl: string | null;
		description: string | null;
	};
	providers: {
		sevenTv: { claimed: boolean; count: number };
		bttv: { count: number };
		ffz: { count: number };
	};
};

type Step = "twitch" | "account";
const STEP_ORDER: Step[] = ["twitch", "account"];
const STEP_LABEL: Record<Step, string> = {
	twitch: "Twitch",
	account: "Account",
};

export default function SetupWizard() {
	const router = useRouter();

	// Client-side setup-completed gate. Avoids the unreliable Worker→Worker
	// SSR fetch the page-level redirect used to do.
	const status = useQuery(trpc.setup.getStatus.queryOptions());
	useEffect(() => {
		if (status.data?.setupCompleted) {
			router.replace("/");
		}
	}, [status.data?.setupCompleted, router]);

	const [step, setStep] = useState<Step>("twitch");
	const [resolved, setResolved] = useState<LookupResult | null>(null);
	const [displayName, setDisplayName] = useState("");
	const [email, setEmail] = useState("");
	const [emailError, setEmailError] = useState<string | null>(null);
	const [password, setPassword] = useState("");
	const [lookupError, setLookupError] = useState<string | null>(null);
	const [done, setDone] = useState(false);

	const lookup = useMutation(
		trpc.setup.lookup.mutationOptions({
			onSuccess: (data) => {
				setResolved(data);
				setDisplayName(data.user.displayName);
				setLookupError(null);
				setStep("account");
			},
			onError: (e) => {
				setLookupError(e.message);
			},
		}),
	);

	const commit = useMutation(
		trpc.setup.commit.mutationOptions({
			onSuccess: () => {
				setDone(true);
				// Brief success state, then redirect.
				setTimeout(() => {
					router.push("/dashboard");
					router.refresh();
				}, 750);
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function submitTwitch(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const username = String(new FormData(e.currentTarget).get("username") ?? "").trim();
		if (!username) return;
		lookup.mutate({ username });
	}

	function submitAccount(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!resolved) return;
		const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
		if (!ok) {
			setEmailError("Enter a valid email address.");
			return;
		}
		setEmailError(null);
		commit.mutate({
			email,
			password,
			twitchId: resolved.user.id,
			login: resolved.user.login,
			displayName: displayName.trim(),
			bio: resolved.user.description,
			avatarUrl: resolved.user.profileImageUrl,
		});
	}

	if (done) {
		return <SuccessCard displayName={displayName} />;
	}

	return (
		<div className="mx-auto w-full max-w-md">
			<StepIndicator step={step} />

			{step === "twitch" ? (
				<form onSubmit={submitTwitch} className="mt-6 flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="su-username">Twitch username</Label>
						<Input
							id="su-username"
							name="username"
							placeholder="your_twitch_handle"
							autoFocus
							required
							className="h-11"
							disabled={lookup.isPending}
							aria-invalid={!!lookupError}
						/>
						{lookupError ? (
							<div className="rounded-md border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-destructive text-xs">
								{lookupError}
							</div>
						) : (
							<p className="text-muted-foreground text-xs">
								We'll fetch your display name, avatar, and emote channels from Twitch.
							</p>
						)}
					</div>
					<Button type="submit" disabled={lookup.isPending}>
						<Tv className="mr-1.5 h-4 w-4" aria-hidden />
						{lookup.isPending ? "Looking up…" : "Look up channel"}
					</Button>
				</form>
			) : null}

			{step === "account" && resolved ? (
				<>
					<div className="mt-6">
						<RecapCard resolved={resolved} />
					</div>
					<form onSubmit={submitAccount} className="mt-6 flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="su-display">Display name</Label>
							<Input
								id="su-display"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								required
								maxLength={40}
							/>
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="su-email">Email</Label>
								<Input
									id="su-email"
									type="email"
									autoComplete="email"
									value={email}
									onChange={(e) => {
										setEmail(e.target.value);
										if (emailError) setEmailError(null);
									}}
									onBlur={() => {
										if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
											setEmailError("Enter a valid email address.");
										}
									}}
									aria-invalid={!!emailError}
									required
								/>
								{emailError ? <p className="text-destructive text-xs">{emailError}</p> : null}
							</div>
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="su-pwd">Password</Label>
								<Input
									id="su-pwd"
									type="password"
									autoComplete="new-password"
									minLength={8}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
								<PasswordMeter value={password} />
							</div>
						</div>
						<div className="mt-1 flex gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setStep("twitch")}
								disabled={commit.isPending}
								className="flex-none"
								aria-label="Back"
							>
								<ArrowLeft className="h-4 w-4" aria-hidden />
							</Button>
							<Button type="submit" className="flex-1" disabled={commit.isPending}>
								<PawPrint className="mr-1.5 h-4 w-4" aria-hidden />
								{commit.isPending ? "Creating your den…" : "Open the den"}
							</Button>
						</div>
					</form>
				</>
			) : null}
		</div>
	);
}

function StepIndicator({ step }: { step: Step }) {
	const num = STEP_ORDER.indexOf(step) + 1;
	const total = STEP_ORDER.length;
	return (
		<div className="flex flex-col items-center gap-3">
			<span className="font-mono text-[11px] text-fg-3 uppercase tracking-wider">
				Step {num} of {total} · {STEP_LABEL[step]}
			</span>
			<div className="flex items-center gap-1.5">
				{STEP_ORDER.map((s) => (
					<span
						key={s}
						aria-current={s === step ? "step" : undefined}
						className={`h-1 w-10 rounded-full transition ${
							s === step ? "bg-cyan" : STEP_ORDER.indexOf(s) < num - 1 ? "bg-cyan/50" : "bg-bg-3"
						}`}
					/>
				))}
			</div>
		</div>
	);
}

function passwordStrength(value: string): number {
	if (!value) return 0;
	let score = 0;
	if (value.length >= 8) score++;
	if (value.length >= 12) score++;
	if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
	if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
	return score;
}

function PasswordMeter({ value }: { value: string }) {
	const score = useMemo(() => passwordStrength(value), [value]);
	const label = ["Too short", "Weak", "OK", "Good", "Strong"][score] ?? "";
	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex gap-1">
				{[0, 1, 2, 3].map((i) => (
					<span
						key={i}
						className={`h-1 flex-1 rounded-full ${i < score ? "bg-cyan" : "bg-bg-3"}`}
					/>
				))}
			</div>
			<p className="text-muted-foreground text-xs">{value ? label : "At least 8 characters."}</p>
		</div>
	);
}

function RecapCard({ resolved }: { resolved: LookupResult }) {
	const { user, providers } = resolved;
	return (
		<div className="rounded-lg border border-border bg-card p-4">
			<div className="flex items-start gap-3">
				{user.profileImageUrl ? (
					// biome-ignore lint/performance/noImgElement: external Twitch CDN
					<img
						src={user.profileImageUrl}
						alt=""
						className="h-12 w-12 flex-none rounded-full bg-bg-3"
					/>
				) : (
					<div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-cyan-soft font-display font-semibold text-fg uppercase">
						{user.displayName.charAt(0)}
					</div>
				)}
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1.5">
						<h2 className="truncate font-display font-semibold text-foreground">
							{user.displayName}
						</h2>
						<BadgeCheck className="h-4 w-4 flex-none text-cyan" aria-label="Twitch" />
					</div>
					<p className="truncate font-mono text-muted-foreground text-xs">twitch.tv/{user.login}</p>
				</div>
			</div>
			<div className="mt-3 grid grid-cols-3 gap-2">
				<ProviderBadge name="7TV" count={providers.sevenTv.count} ok={providers.sevenTv.claimed} />
				<ProviderBadge name="BTTV" count={providers.bttv.count} ok={providers.bttv.count > 0} />
				<ProviderBadge name="FFZ" count={providers.ffz.count} ok={providers.ffz.count > 0} />
			</div>
			{!providers.sevenTv.claimed ? (
				<p className="mt-3 text-muted-foreground text-xs">
					No 7TV account yet — sign in at{" "}
					<a
						href="https://7tv.app"
						target="_blank"
						rel="noopener noreferrer"
						className="text-cyan hover:opacity-80"
					>
						7tv.app
					</a>{" "}
					with Twitch to enable.
				</p>
			) : null}
		</div>
	);
}

function ProviderBadge({ name, count, ok }: { name: string; count: number; ok: boolean }) {
	return (
		<div
			className={`rounded-md border px-3 py-2 text-center ${
				ok ? "border-cyan-soft bg-cyan-glow" : "border-border bg-bg-2"
			}`}
		>
			<div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
				{name}
			</div>
			<div
				className={`mt-0.5 font-display font-semibold text-sm ${
					ok ? "text-cyan" : "text-muted-foreground"
				}`}
			>
				{count}
			</div>
		</div>
	);
}

function SuccessCard({ displayName }: { displayName: string }) {
	return (
		<div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-cyan-soft bg-cyan-glow p-8 text-center">
			<div className="grid h-12 w-12 place-items-center rounded-full bg-cyan text-bg">
				<Check className="h-6 w-6" aria-hidden />
			</div>
			<div>
				<h2 className="font-display font-semibold text-foreground text-lg">Welcome to the den</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Setting up your dashboard, {displayName.split(" ")[0]}…
				</p>
			</div>
			<Eye className="h-4 w-4 animate-pulse text-cyan" aria-hidden />
		</div>
	);
}
