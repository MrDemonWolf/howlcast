"use client";

// Single-form login. Email + password is the primary path; magic-link
// and passkey are secondary buttons under the form (progressive
// disclosure). Username login is a small "use username instead" toggle
// that swaps the email field — most folks won't see it.

import { Button } from "@howlcast/ui/components/button";
import { DisplayHeading } from "@howlcast/ui/components/display-heading";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { Fingerprint, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { formatAuthError } from "@/lib/auth-toast";

type IdMode = "email" | "username";

export default function LoginForm() {
	const router = useRouter();
	const [idMode, setIdMode] = useState<IdMode>("email");
	const [submitting, setSubmitting] = useState(false);
	const [magicSent, setMagicSent] = useState(false);
	const [magicEmail, setMagicEmail] = useState("");

	function onSuccess() {
		toast.success("Welcome back.");
		router.push("/dashboard");
	}

	function onErr(error: unknown) {
		toast.error(formatAuthError(error, "Sign-in failed."));
	}

	async function submit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		const password = String(data.get("password") ?? "");
		setSubmitting(true);
		try {
			if (idMode === "email") {
				await authClient.signIn.email(
					{ email: String(data.get("email") ?? ""), password },
					{ onSuccess, onError: onErr },
				);
			} else {
				await authClient.signIn.username(
					{ username: String(data.get("username") ?? ""), password },
					{ onSuccess, onError: onErr },
				);
			}
		} finally {
			setSubmitting(false);
		}
	}

	async function sendMagicLink() {
		const email = magicEmail.trim();
		if (!email) {
			toast.error("Enter your email first.");
			return;
		}
		setSubmitting(true);
		try {
			await authClient.signIn.magicLink(
				{ email, callbackURL: "/dashboard" },
				{
					onSuccess: () => setMagicSent(true),
					onError: onErr,
				},
			);
		} finally {
			setSubmitting(false);
		}
	}

	async function signInWithPasskey() {
		setSubmitting(true);
		try {
			await authClient.signIn.passkey({}, { onSuccess, onError: onErr });
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="mx-auto w-full max-w-sm">
			<DisplayHeading size="lg" className="mb-1.5 text-center">
				Sign in
			</DisplayHeading>
			<p className="mb-8 text-center text-muted-foreground text-sm">For the inner circle.</p>

			<form onSubmit={submit} className="flex flex-col gap-3">
				<div className="flex flex-col gap-1.5">
					{idMode === "email" ? (
						<>
							<Label htmlFor="li-email">Email</Label>
							<Input
								id="li-email"
								name="email"
								type="email"
								autoComplete="email"
								required
								onChange={(e) => setMagicEmail(e.target.value)}
							/>
						</>
					) : (
						<>
							<Label htmlFor="li-username">Username</Label>
							<Input id="li-username" name="username" autoComplete="username" required />
						</>
					)}
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="li-password">Password</Label>
					<Input
						id="li-password"
						name="password"
						type="password"
						autoComplete="current-password"
						minLength={8}
						required
					/>
				</div>
				<Button type="submit" disabled={submitting} className="mt-2">
					{submitting ? "Signing in…" : "Sign in"}
				</Button>
			</form>

			<div className="mt-3 flex gap-2">
				<Button
					type="button"
					variant="outline"
					className="flex-1"
					onClick={sendMagicLink}
					disabled={submitting || magicSent || idMode !== "email"}
				>
					<Mail className="mr-1.5 h-3.5 w-3.5" aria-hidden />
					{magicSent ? "Check your inbox" : "Email a link"}
				</Button>
				<Button
					type="button"
					variant="outline"
					className="flex-1"
					onClick={signInWithPasskey}
					disabled={submitting}
				>
					<Fingerprint className="mr-1.5 h-3.5 w-3.5" aria-hidden />
					Passkey
				</Button>
			</div>

			<div className="mt-6 flex flex-col items-center gap-2 text-muted-foreground text-xs">
				<button
					type="button"
					onClick={() => {
						setIdMode((m) => (m === "email" ? "username" : "email"));
						setMagicSent(false);
					}}
					className="text-fg-3 hover:text-foreground"
				>
					{idMode === "email" ? "Use username instead" : "Use email instead"}
				</button>
				<span>Den is invite-only — the broadcaster sends invites by email.</span>
			</div>
		</div>
	);
}
