"use client";

import { Button } from "@howlcast/ui/components/button";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@howlcast/ui/components/tabs";
import { Fingerprint, KeyRound, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

type Mode = "email" | "username" | "magic" | "passkey";

export default function LoginForm() {
	const router = useRouter();
	const [mode, setMode] = useState<Mode>("email");
	const [submitting, setSubmitting] = useState(false);

	function onSuccess() {
		toast.success("Welcome back.");
		router.push("/dashboard");
	}

	function onErr(error: unknown) {
		const message =
			(error as { error?: { message?: string } })?.error?.message ??
			(error as Error)?.message ??
			"Sign-in failed.";
		toast.error(message);
	}

	async function submitEmail(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		setSubmitting(true);
		try {
			await authClient.signIn.email(
				{
					email: String(data.get("email") ?? ""),
					password: String(data.get("password") ?? ""),
				},
				{ onSuccess, onError: onErr },
			);
		} finally {
			setSubmitting(false);
		}
	}

	async function submitUsername(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		setSubmitting(true);
		try {
			await authClient.signIn.username(
				{
					username: String(data.get("username") ?? ""),
					password: String(data.get("password") ?? ""),
				},
				{ onSuccess, onError: onErr },
			);
		} finally {
			setSubmitting(false);
		}
	}

	async function submitMagic(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		setSubmitting(true);
		try {
			await authClient.signIn.magicLink(
				{
					email: String(data.get("email") ?? ""),
					callbackURL: "/dashboard",
				},
				{
					onSuccess: () => {
						toast.success("Check your inbox for the link.");
					},
					onError: onErr,
				},
			);
		} finally {
			setSubmitting(false);
		}
	}

	async function submitPasskey() {
		setSubmitting(true);
		try {
			await authClient.signIn.passkey({}, { onSuccess, onError: onErr });
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="mx-auto w-full max-w-md">
			<h1 className="mb-2 text-center font-display font-semibold text-3xl text-foreground tracking-tight">
				Sign in
			</h1>
			<p className="mb-8 text-center text-muted-foreground text-sm">
				For the inner circle.
			</p>

			<Tabs
				value={mode}
				onValueChange={(v) => setMode(v as Mode)}
				className="flex flex-col items-center"
			>
				<TabsList className="mb-2">
					<TabsTrigger value="email">
						<Mail className="h-3.5 w-3.5" />
						Email
					</TabsTrigger>
					<TabsTrigger value="username">
						<User className="h-3.5 w-3.5" />
						Username
					</TabsTrigger>
					<TabsTrigger value="magic">
						<KeyRound className="h-3.5 w-3.5" />
						Magic
					</TabsTrigger>
					<TabsTrigger value="passkey">
						<Fingerprint className="h-3.5 w-3.5" />
						Passkey
					</TabsTrigger>
				</TabsList>

				<TabsContent value="email" className="w-full">
					<form onSubmit={submitEmail} className="flex flex-col gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="email-email">Email</Label>
							<Input
								id="email-email"
								name="email"
								type="email"
								autoComplete="email"
								required
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="email-password">Password</Label>
							<Input
								id="email-password"
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
				</TabsContent>

				<TabsContent value="username" className="w-full">
					<form onSubmit={submitUsername} className="flex flex-col gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="u-username">Username</Label>
							<Input
								id="u-username"
								name="username"
								autoComplete="username"
								required
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="u-password">Password</Label>
							<Input
								id="u-password"
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
				</TabsContent>

				<TabsContent value="magic" className="w-full">
					<form onSubmit={submitMagic} className="flex flex-col gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="magic-email">Email</Label>
							<Input
								id="magic-email"
								name="email"
								type="email"
								autoComplete="email"
								required
							/>
							<p className="text-muted-foreground text-xs">
								We'll email you a one-time link. Expires in 15 minutes.
							</p>
						</div>
						<Button type="submit" disabled={submitting} className="mt-2">
							{submitting ? "Sending…" : "Send magic link"}
						</Button>
					</form>
				</TabsContent>

				<TabsContent value="passkey" className="w-full">
					<div className="flex flex-col gap-3">
						<p className="text-muted-foreground text-sm">
							Use a registered passkey to sign in. The browser will prompt for
							your authenticator.
						</p>
						<Button type="button" onClick={submitPasskey} disabled={submitting}>
							{submitting ? "Authenticating…" : "Sign in with passkey"}
						</Button>
					</div>
				</TabsContent>
			</Tabs>

			<div className="mt-8 text-center text-muted-foreground text-sm">
				No account?{" "}
				<Link href="/signup" className="text-cyan hover:opacity-80">
					Create one
				</Link>
			</div>
		</div>
	);
}
