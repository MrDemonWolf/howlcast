"use client";

import { Button } from "@howlcast/ui/components/button";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function SignUpForm() {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);

	async function submit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		setSubmitting(true);
		try {
			await authClient.signUp.email(
				{
					name: String(data.get("name") ?? ""),
					email: String(data.get("email") ?? ""),
					password: String(data.get("password") ?? ""),
				},
				{
					onSuccess: () => {
						toast.success("Account created.");
						router.push("/dashboard");
					},
					onError: (error) => {
						toast.error(
							error.error.message ||
								error.error.statusText ||
								"Could not create account.",
						);
					},
				},
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="mx-auto w-full max-w-md">
			<h1 className="mb-2 text-center font-display font-semibold text-3xl text-foreground tracking-tight">
				Create account
			</h1>
			<p className="mb-8 text-center text-muted-foreground text-sm">
				The den is invite-only — you can sign up, but chat is gated.
			</p>

			<form onSubmit={submit} className="flex flex-col gap-3">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="su-name">Display name</Label>
					<Input id="su-name" name="name" autoComplete="name" required />
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="su-email">Email</Label>
					<Input
						id="su-email"
						name="email"
						type="email"
						autoComplete="email"
						required
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="su-password">Password</Label>
					<Input
						id="su-password"
						name="password"
						type="password"
						autoComplete="new-password"
						minLength={8}
						required
					/>
					<p className="text-muted-foreground text-xs">
						At least 8 characters.
					</p>
				</div>
				<Button type="submit" disabled={submitting} className="mt-2">
					{submitting ? "Creating account…" : "Create account"}
				</Button>
			</form>

			<div className="mt-8 text-center text-muted-foreground text-sm">
				Have an account?{" "}
				<Link href="/login" className="text-cyan hover:opacity-80">
					Sign in
				</Link>
			</div>
		</div>
	);
}
