"use client";

// Invite accept landing. Two states:
//   - signed-in: button → admin.acceptInvite → flips isInvited.
//   - signed-out: magic-link form to create the viewer account.
//     After magic-link callback they hit this page again signed-in.

import { Button } from "@howlcast/ui/components/button";
import { DisplayHeading } from "@howlcast/ui/components/display-heading";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { formatAuthError } from "@/lib/auth-toast";
import { trpc } from "@/utils/trpc";

export default function InviteAccept({ code }: { code: string }) {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();
	const [magicSent, setMagicSent] = useState(false);
	const [submitting, setSubmitting] = useState(false);

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
					onSuccess: () => {
						setMagicSent(true);
					},
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

	if (session?.user) {
		return (
			<div className="mx-auto w-full max-w-sm text-center">
				<DisplayHeading size="lg" className="mb-2">
					You're invited
				</DisplayHeading>
				<p className="mb-6 text-muted-foreground text-sm">
					Click below to accept and unlock chat in the den.
				</p>
				<Button
					type="button"
					onClick={() => accept.mutate({ code })}
					disabled={accept.isPending}
					className="w-full"
				>
					{accept.isPending ? "Accepting…" : "Accept invite"}
				</Button>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-sm">
			<DisplayHeading size="lg" className="mb-2 text-center">
				You're invited
			</DisplayHeading>
			<p className="mb-6 text-center text-muted-foreground text-sm">
				Enter your email — we'll send a link to sign you in. The invite will be accepted
				automatically.
			</p>
			{magicSent ? (
				<div className="rounded-md border border-cyan-soft bg-cyan-glow p-4 text-center text-foreground text-sm">
					Check your inbox for the link.
				</div>
			) : (
				<form onSubmit={sendMagic} className="flex flex-col gap-3">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="iv-email">Email</Label>
						<Input id="iv-email" name="email" type="email" autoComplete="email" required />
					</div>
					<Button type="submit" disabled={submitting} className="mt-2">
						{submitting ? "Sending…" : "Email me a link"}
					</Button>
				</form>
			)}
		</div>
	);
}
