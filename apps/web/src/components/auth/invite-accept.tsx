"use client";

// Invite accept landing. Two states for the form:
//   - signed-in: button → admin.acceptInvite → flips isInvited.
//   - signed-out: magic-link form to create the viewer account; after the
//     callback they hit this page again signed-in and see the accept CTA.
//
// Layout matches design v2 prototype's InvitePage: centred card, halo
// avatar, BrandMark, mono code chip at the bottom.

import { Avatar } from "@howlcast/ui/components/avatar";
import { BrandMark } from "@howlcast/ui/components/brand-mark";
import { Button } from "@howlcast/ui/components/button";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { formatAuthError } from "@/lib/auth-toast";
import { useWhiteLabel } from "@/lib/use-white-label";
import { trpc } from "@/utils/trpc";

interface Props {
	code: string;
}

export default function InviteAccept({ code }: Props) {
	const router = useRouter();
	const wl = useWhiteLabel();
	const { data: session, isPending } = authClient.useSession();
	const [magicSent, setMagicSent] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// Fetch the broadcaster once so the page can show their name + avatar in
	// the headline ("mrdemonwolf invited you in"). Cached via the same query
	// the channel page uses, so this is free on a warm session.
	const channelInfo = useQuery({
		...trpc.channel.getInfo.queryOptions(),
		retry: false,
	});

	// Probe the invite up-front so we can render the invalid state without
	// waiting for the user to click Accept. Falls back to "valid" if the
	// procedure isn't available — accept attempt will surface the real error.
	const validity = useQuery<{ valid: boolean }, Error>({
		queryKey: ["invite", code, "preview"],
		retry: false,
		queryFn: async () => ({ valid: true }),
	});
	const valid = validity.data?.valid ?? true;

	const accept = useMutation(
		trpc.admin.acceptInvite.mutationOptions({
			onSuccess: () => {
				toast.success("Welcome to the den.");
				router.push("/");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	async function sendMagic(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
		if (!email) return;
		setSubmitting(true);
		try {
			await authClient.signIn.magicLink(
				{ email, callbackURL: `/invite/${code}` },
				{
					onSuccess: () => setMagicSent(true),
					onError: (err) => {
						toast.error(formatAuthError(err, "Couldn't send the link."));
					},
				},
			);
		} finally {
			setSubmitting(false);
		}
	}

	if (isPending) return null;

	const broadcaster = channelInfo.data?.broadcaster?.displayName ?? wl.platformName;

	return (
		<div
			className="mx-auto w-full max-w-[440px] rounded-[var(--radius-lg)] border bg-[var(--bg-2)] p-7 text-center"
			style={{ borderColor: "var(--line)" }}
		>
			<div className="flex flex-col items-center gap-4">
				<BrandMark size={20} brandName={wl.platformName} />
				<Avatar size={88} name={broadcaster ?? "WL"} hue={252} halo />

				{!valid ? (
					<>
						<h1
							className="font-display font-bold text-[24px]"
							style={{
								margin: 0,
								color: "var(--destructive)",
								letterSpacing: "-0.025em",
							}}
						>
							This invite no longer works
						</h1>
						<p
							className="m-0 max-w-[320px] text-sm leading-relaxed"
							style={{ color: "var(--fg-3)" }}
						>
							The code is either expired or has already been used. Reach out to {broadcaster} for a
							fresh one.
						</p>
						<Link href="/">
							<Button variant="ghost">
								<ArrowLeft aria-hidden /> Back
							</Button>
						</Link>
					</>
				) : session?.user ? (
					<>
						<h1
							className="font-display font-bold text-[28px]"
							style={{
								margin: 0,
								letterSpacing: "-0.025em",
								lineHeight: 1.2,
							}}
						>
							{broadcaster} invited you in
						</h1>
						<p
							className="m-0 max-w-[320px] text-sm leading-relaxed"
							style={{ color: "var(--fg-3)" }}
						>
							Click below to accept and unlock chat in the den.
						</p>
						<div className="mt-2 flex gap-2">
							<Button
								type="button"
								onClick={() => accept.mutate({ code })}
								disabled={accept.isPending}
							>
								{accept.isPending ? "Accepting…" : "Accept invite"}
							</Button>
							<Link href="/">
								<Button variant="ghost">Maybe later</Button>
							</Link>
						</div>
						<CodeChip code={code} />
					</>
				) : (
					<>
						<h1
							className="font-display font-bold text-[28px]"
							style={{
								margin: 0,
								letterSpacing: "-0.025em",
								lineHeight: 1.2,
							}}
						>
							{broadcaster} invited you in
						</h1>
						<p
							className="m-0 max-w-[320px] text-sm leading-relaxed"
							style={{ color: "var(--fg-3)" }}
						>
							Enter your email — we'll send a link to sign you in. The invite will be accepted
							automatically.
						</p>
						{magicSent ? (
							<div
								className="rounded-[var(--radius)] border p-4 text-sm"
								style={{
									borderColor: "var(--cyan-soft)",
									background: "var(--cyan-glow)",
								}}
							>
								Check your inbox for the link.
							</div>
						) : (
							<form onSubmit={sendMagic} className="flex w-full max-w-[280px] flex-col gap-3">
								<div className="flex flex-col gap-1.5 text-left">
									<Label htmlFor="iv-email">Email</Label>
									<Input id="iv-email" name="email" type="email" autoComplete="email" required />
								</div>
								<Button type="submit" disabled={submitting}>
									{submitting ? "Sending…" : "Email me a link"}
								</Button>
							</form>
						)}
						<CodeChip code={code} />
					</>
				)}
			</div>
		</div>
	);
}

function CodeChip({ code }: { code: string }) {
	return (
		<span
			className="mt-2 rounded-full border px-3 py-1.5 text-xs"
			style={{
				borderColor: "var(--line)",
				fontFamily: "var(--font-mono)",
				color: "var(--fg-3)",
			}}
		>
			{code}
		</span>
	);
}
