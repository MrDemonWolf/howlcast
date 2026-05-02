"use client";

// First-run setup wizard. Two-step flow:
//   1. Username input -> tRPC `setup.lookup` resolves Twitch user + probes
//      7TV / BTTV / FFZ. Result rendered as a recap card.
//   2. Confirm display name + visibility -> tRPC `setup.commit` writes the
//      broadcaster profile + channelConfig and redirects to /dashboard.
//
// Phase 6 will improve this (avatar download to R2, edit-after-completion,
// etc.); for now it's a focused single-page component.

import { Button } from "@howlcast/ui/components/button";
import { DisplayHeading } from "@howlcast/ui/components/display-heading";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { useMutation } from "@tanstack/react-query";
import { BadgeCheck, Lock, PawPrint, Tv, Users } from "lucide-react";
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

export default function SetupWizard() {
	const router = useRouter();
	const [resolved, setResolved] = useState<LookupResult | null>(null);
	const [displayName, setDisplayName] = useState("");
	const [visibility, setVisibility] = useState<"public" | "invite_only">("invite_only");

	const lookup = useMutation(
		trpc.setup.lookup.mutationOptions({
			onSuccess: (data) => {
				setResolved(data);
				setDisplayName(data.user.displayName);
				toast.success("Found your channel.");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const commit = useMutation(
		trpc.setup.commit.mutationOptions({
			onSuccess: () => {
				toast.success("Setup complete. Welcome to the den.");
				router.push("/dashboard");
				router.refresh();
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function submitLookup(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const username = String(new FormData(e.currentTarget).get("username") ?? "").trim();
		if (!username) return;
		lookup.mutate({ username });
	}

	function submitCommit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!resolved) return;
		commit.mutate({
			twitchId: resolved.user.id,
			login: resolved.user.login,
			displayName: displayName.trim(),
			bio: resolved.user.description,
			avatarUrl: resolved.user.profileImageUrl,
			visibility,
		});
	}

	return (
		<div className="mx-auto w-full max-w-xl">
			<DisplayHeading size="lg" className="mb-2 text-center">
				Set up your den
			</DisplayHeading>
			<p className="mb-8 text-center text-muted-foreground text-sm">
				One field. We pull everything else from Twitch.
			</p>

			{!resolved ? (
				<form onSubmit={submitLookup} className="flex flex-col gap-4">
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
						<p className="text-muted-foreground text-xs">
							We'll look up your display name, avatar, and emote channels.
						</p>
					</div>
					<Button type="submit" disabled={lookup.isPending}>
						<Tv className="mr-1.5 h-4 w-4" aria-hidden />
						{lookup.isPending ? "Looking up…" : "Look up channel"}
					</Button>
				</form>
			) : (
				<div className="flex flex-col gap-6">
					<RecapCard resolved={resolved} />

					<form onSubmit={submitCommit} className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="su-display">Display name</Label>
							<Input
								id="su-display"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								required
								maxLength={40}
							/>
							<p className="text-muted-foreground text-xs">
								Shown above the player. Pulled from Twitch — change if you'd like.
							</p>
						</div>

						<fieldset className="flex flex-col gap-1.5">
							<Label>Visibility</Label>
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
						</fieldset>

						<div className="mt-2 flex gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setResolved(null)}
								disabled={commit.isPending}
							>
								Back
							</Button>
							<Button type="submit" className="flex-1" disabled={commit.isPending}>
								<PawPrint className="mr-1.5 h-4 w-4" aria-hidden />
								{commit.isPending ? "Setting up…" : "Open the den"}
							</Button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}

function RecapCard({ resolved }: { resolved: LookupResult }) {
	const { user, providers } = resolved;
	return (
		<div className="rounded-lg border border-border bg-card p-4">
			<div className="flex items-start gap-3">
				{user.profileImageUrl ? (
					// biome-ignore lint/performance/noImgElement: external Twitch CDN, cached on render
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
						<BadgeCheck className="h-4 w-4 flex-none text-cyan" aria-label="Twitch verified" />
					</div>
					<p className="truncate font-mono text-muted-foreground text-xs">
						twitch.tv/{user.login} · id {user.id}
					</p>
				</div>
			</div>

			{user.description ? (
				<p className="mt-3 line-clamp-3 text-muted-foreground text-sm">{user.description}</p>
			) : null}

			<div className="mt-4 grid grid-cols-3 gap-2">
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
					with Twitch to enable. The pipeline picks up emotes on the next refresh.
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
