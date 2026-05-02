"use client";

// First-run setup wizard. Three steps in a single page:
//   1. Twitch lookup — username -> Helix profile + emote-provider probe
//   2. Account     — email + password (creates the broadcaster login)
//   3. Mode        — public / invite-only
//
// On commit, server creates the user (signUpEmail), writes the
// broadcaster profile + channelConfig, and sets the session cookie.
// Client redirects straight to /dashboard signed in.

import { Button } from "@howlcast/ui/components/button";
import { DisplayHeading } from "@howlcast/ui/components/display-heading";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Lock, PawPrint, Tv, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
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

type Step = "twitch" | "account" | "mode";

export default function SetupWizard() {
	const router = useRouter();

	const [step, setStep] = useState<Step>("twitch");
	const [resolved, setResolved] = useState<LookupResult | null>(null);
	const [displayName, setDisplayName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [visibility, setVisibility] = useState<"public" | "invite_only">("invite_only");

	const lookup = useMutation(
		trpc.setup.lookup.mutationOptions({
			onSuccess: (data) => {
				setResolved(data);
				setDisplayName(data.user.displayName);
				setStep("account");
				toast.success("Found your channel.");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const commit = useMutation(
		trpc.setup.commit.mutationOptions({
			onSuccess: () => {
				toast.success("Welcome to the den.");
				router.push("/dashboard");
				router.refresh();
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

	function submitFinal() {
		if (!resolved) return;
		commit.mutate({
			email,
			password,
			twitchId: resolved.user.id,
			login: resolved.user.login,
			displayName: displayName.trim(),
			bio: resolved.user.description,
			avatarUrl: resolved.user.profileImageUrl,
			visibility,
		});
	}

	return (
		<div className="mx-auto w-full max-w-md">
			<DisplayHeading size="lg" className="mb-1.5 text-center">
				Set up your den
			</DisplayHeading>
			<p className="mb-6 text-center text-muted-foreground text-sm">
				One time. We pull everything from Twitch.
			</p>

			<StepDots step={step} />

			{step === "twitch" ? (
				<form onSubmit={submitTwitch} className="mt-6 flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="su-username">Twitch username</Label>
						<Input
							id="su-username"
							name="username"
							placeholder="mrdemonwolf"
							autoFocus
							required
							disabled={lookup.isPending}
						/>
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
					<form
						onSubmit={(e) => {
							e.preventDefault();
							setStep("mode");
						}}
						className="mt-6 flex flex-col gap-4"
					>
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
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="su-email">Email</Label>
							<Input
								id="su-email"
								type="email"
								autoComplete="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
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
							<p className="text-muted-foreground text-xs">At least 8 characters.</p>
						</div>
						<div className="mt-1 flex gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setStep("twitch")}
								className="flex-none"
							>
								<ArrowLeft className="h-4 w-4" aria-hidden />
							</Button>
							<Button type="submit" className="flex-1">
								Continue
							</Button>
						</div>
					</form>
				</>
			) : null}

			{step === "mode" ? (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						submitFinal();
					}}
					className="mt-6 flex flex-col gap-4"
				>
					<fieldset className="flex flex-col gap-1.5">
						<Label>Channel visibility</Label>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<VisibilityCard
								checked={visibility === "invite_only"}
								onSelect={() => setVisibility("invite_only")}
								icon={<Lock className="h-4 w-4" aria-hidden />}
								title="Invite-only"
								description="Watching public, posting den-only."
							/>
							<VisibilityCard
								checked={visibility === "public"}
								onSelect={() => setVisibility("public")}
								icon={<Users className="h-4 w-4" aria-hidden />}
								title="Public"
								description="Anyone can watch and post."
							/>
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							You can change this anytime in the dashboard.
						</p>
					</fieldset>
					<div className="mt-1 flex gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setStep("account")}
							disabled={commit.isPending}
							className="flex-none"
						>
							<ArrowLeft className="h-4 w-4" aria-hidden />
						</Button>
						<Button type="submit" className="flex-1" disabled={commit.isPending}>
							<PawPrint className="mr-1.5 h-4 w-4" aria-hidden />
							{commit.isPending ? "Setting up…" : "Open the den"}
						</Button>
					</div>
				</form>
			) : null}
		</div>
	);
}

function StepDots({ step }: { step: Step }) {
	const order: Step[] = ["twitch", "account", "mode"];
	return (
		<div className="flex items-center justify-center gap-1.5">
			{order.map((s) => (
				<span
					key={s}
					aria-current={s === step ? "step" : undefined}
					className={`h-1 w-6 rounded-full transition ${
						s === step
							? "bg-cyan"
							: order.indexOf(s) < order.indexOf(step)
								? "bg-cyan/40"
								: "bg-bg-3"
					}`}
				/>
			))}
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
						<BadgeCheck className="h-4 w-4 flex-none text-cyan" aria-label="verified" />
					</div>
					<p className="truncate font-mono text-muted-foreground text-xs">twitch.tv/{user.login}</p>
				</div>
			</div>
			<div className="mt-3 grid grid-cols-3 gap-2">
				<ProviderBadge name="7TV" count={providers.sevenTv.count} ok={providers.sevenTv.claimed} />
				<ProviderBadge name="BTTV" count={providers.bttv.count} ok={providers.bttv.count > 0} />
				<ProviderBadge name="FFZ" count={providers.ffz.count} ok={providers.ffz.count > 0} />
			</div>
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
				className={`mt-0.5 font-display font-semibold text-sm ${ok ? "text-cyan" : "text-muted-foreground"}`}
			>
				{count}
			</div>
		</div>
	);
}

function VisibilityCard({
	checked,
	onSelect,
	icon,
	title,
	description,
}: {
	checked: boolean;
	onSelect: () => void;
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={checked}
			className={`flex w-full flex-col items-start gap-1 rounded-md border p-3 text-left transition ${
				checked ? "border-cyan bg-cyan-glow" : "border-border bg-bg-2 hover:border-line-3"
			}`}
		>
			<div className="flex items-center gap-2">
				<span className={checked ? "text-cyan" : "text-muted-foreground"}>{icon}</span>
				<span className="font-medium text-foreground text-sm">{title}</span>
			</div>
			<p className="text-muted-foreground text-xs">{description}</p>
		</button>
	);
}
