"use client";

// Small "I have an invite code" form. Sends the user to /invite/CODE which
// is where the magic-link / accept flow lives. Splits cleanly from the main
// LoginForm so the login page can offer Sign in / Use invite code as tabs.

import { Button } from "@howlcast/ui/components/button";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

const CODE_PATTERN = /^[A-Z0-9-]+$/i;

export function InviteCodeForm() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	function submit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const raw = String(new FormData(e.currentTarget).get("code") ?? "")
			.trim()
			.toUpperCase();
		if (!raw) {
			setError("Paste the invite code from your email.");
			return;
		}
		if (!CODE_PATTERN.test(raw)) {
			setError("Codes look like INVITE-XXXX-XXXX.");
			return;
		}
		setError(null);
		router.push(`/invite/${encodeURIComponent(raw)}`);
	}

	return (
		<form onSubmit={submit} className="flex flex-col gap-3.5">
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="ic-code" className="flex items-center justify-between">
					<span>Invite code</span>
					<span className="text-xs" style={{ color: "var(--fg-3)" }}>
						From your email
					</span>
				</Label>
				<Input
					id="ic-code"
					name="code"
					placeholder="INVITE-XXXX-XXXX"
					autoComplete="off"
					autoCapitalize="characters"
					required
					style={{ fontFamily: "var(--font-mono)" }}
				/>
				{error ? (
					<p className="text-destructive text-xs">{error}</p>
				) : (
					<p className="text-xs" style={{ color: "var(--fg-3)" }}>
						No code? Only the broadcaster can send invites — reach out to them directly.
					</p>
				)}
			</div>
			<Button type="submit" className="mt-1 w-full">
				Redeem code &amp; create account
			</Button>
		</form>
	);
}
