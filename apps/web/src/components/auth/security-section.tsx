"use client";

import { Button } from "@howlcast/ui/components/button";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { Fingerprint, ShieldCheck, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { toastAuthError } from "@/lib/auth-toast";

type Passkey = { id: string; name?: string | null; createdAt?: Date };
type Session = {
	id: string;
	token: string;
	userAgent?: string | null;
	ipAddress?: string | null;
	createdAt?: Date;
	expiresAt?: Date;
};

function Card({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-lg border border-border bg-card p-6">
			<header className="mb-4">
				<h2 className="font-semibold text-foreground text-lg">{title}</h2>
				{description ? (
					<p className="mt-1 text-muted-foreground text-sm">{description}</p>
				) : null}
			</header>
			{children}
		</section>
	);
}

export default function SecuritySection() {
	const { data: session } = authClient.useSession();

	const [totpSecret, setTotpSecret] = useState<string | null>(null);
	const [totpUri, setTotpUri] = useState<string | null>(null);
	const [backupCodes, setBackupCodes] = useState<string[]>([]);

	const [passkeys, setPasskeys] = useState<Passkey[]>([]);
	const [sessions, setSessions] = useState<Session[]>([]);

	const refreshPasskeys = async () => {
		const res = await authClient.passkey.listUserPasskeys();
		setPasskeys((res.data ?? []) as unknown as Passkey[]);
	};

	const refreshSessions = async () => {
		const res = await authClient.listSessions();
		setSessions((res.data ?? []) as unknown as Session[]);
	};

	useEffect(() => {
		if (!session) return;
		refreshPasskeys().catch(() => {});
		refreshSessions().catch(() => {});
	}, [session]);

	async function enableTwoFactor(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const password = String(
			new FormData(e.currentTarget).get("password") ?? "",
		);
		const res = await authClient.twoFactor.enable({ password });
		if (toastAuthError(res, "Could not enable 2FA.")) return;
		const data = res.data as
			| { totpURI?: string; backupCodes?: string[] }
			| undefined;
		const uri = data?.totpURI ?? null;
		setTotpUri(uri);
		setTotpSecret(uri ? new URL(uri).searchParams.get("secret") : null);
		setBackupCodes(data?.backupCodes ?? []);
		toast.success("Scan the URI in your authenticator, then verify a code.");
	}

	async function verifyTotp(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const code = String(new FormData(e.currentTarget).get("code") ?? "");
		const res = await authClient.twoFactor.verifyTotp({ code });
		if (toastAuthError(res, "Invalid code.")) return;
		toast.success("2FA verified.");
		setTotpSecret(null);
		setTotpUri(null);
		setBackupCodes([]);
	}

	async function disableTwoFactor(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const password = String(
			new FormData(e.currentTarget).get("password") ?? "",
		);
		const res = await authClient.twoFactor.disable({ password });
		if (toastAuthError(res, "Could not disable 2FA.")) return;
		toast.success("2FA disabled.");
	}

	async function addPasskey(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const name = String(new FormData(e.currentTarget).get("name") ?? "Passkey");
		const res = await authClient.passkey.addPasskey({ name });
		if (toastAuthError(res, "Could not register passkey.")) return;
		toast.success("Passkey added.");
		await refreshPasskeys();
	}

	async function removePasskey(id: string) {
		const res = await authClient.passkey.deletePasskey({ id });
		if (toastAuthError(res, "Could not remove passkey.")) return;
		toast.success("Passkey removed.");
		await refreshPasskeys();
	}

	async function revokeSession(token: string) {
		const res = await authClient.revokeSession({ token });
		if (toastAuthError(res, "Could not revoke session.")) return;
		toast.success("Session revoked.");
		await refreshSessions();
	}

	async function revokeAllOthers() {
		const res = await authClient.revokeOtherSessions();
		if (toastAuthError(res, "Could not revoke sessions.")) return;
		toast.success("Other sessions revoked.");
		await refreshSessions();
	}

	if (!session) {
		return (
			<p className="text-muted-foreground text-sm">
				You need to be signed in to view this page.
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<Card
				title="Two-factor authentication"
				description="Add a TOTP code on top of your password. Required if your account ever gets shared."
			>
				{!totpUri ? (
					<form
						onSubmit={enableTwoFactor}
						className="flex flex-col gap-3 sm:max-w-sm"
					>
						<Label htmlFor="tfa-pwd">Confirm with password</Label>
						<Input
							id="tfa-pwd"
							name="password"
							type="password"
							autoComplete="current-password"
							required
						/>
						<Button type="submit" className="mt-1 w-fit">
							<ShieldCheck className="mr-1.5 h-4 w-4" />
							Enable 2FA
						</Button>
					</form>
				) : (
					<div className="flex flex-col gap-4">
						<div>
							<p className="text-muted-foreground text-sm">
								Add this URI to your authenticator app, or paste the secret
								manually.
							</p>
							<pre className="mt-2 overflow-x-auto rounded-md bg-background px-3 py-2 font-mono text-xs">
								{totpUri}
							</pre>
							{totpSecret ? (
								<p className="mt-1 font-mono text-muted-foreground text-xs">
									Secret: {totpSecret}
								</p>
							) : null}
						</div>
						{backupCodes.length > 0 ? (
							<div>
								<p className="text-foreground text-sm">
									Save these backup codes — they'll never appear again.
								</p>
								<pre className="mt-2 overflow-x-auto rounded-md bg-background px-3 py-2 font-mono text-xs">
									{backupCodes.join("\n")}
								</pre>
							</div>
						) : null}
						<form
							onSubmit={verifyTotp}
							className="flex flex-col gap-3 sm:max-w-sm"
						>
							<Label htmlFor="tfa-code">Verify a code</Label>
							<Input id="tfa-code" name="code" inputMode="numeric" required />
							<Button type="submit" className="mt-1 w-fit">
								Verify
							</Button>
						</form>
					</div>
				)}

				<details className="mt-6">
					<summary className="cursor-pointer text-muted-foreground text-sm">
						Disable 2FA
					</summary>
					<form
						onSubmit={disableTwoFactor}
						className="mt-3 flex flex-col gap-3 sm:max-w-sm"
					>
						<Label htmlFor="tfa-disable-pwd">Confirm with password</Label>
						<Input
							id="tfa-disable-pwd"
							name="password"
							type="password"
							autoComplete="current-password"
							required
						/>
						<Button type="submit" variant="outline" className="w-fit">
							Disable
						</Button>
					</form>
				</details>
			</Card>

			<Card
				title="Passkeys"
				description="Register a passkey to skip the password on supported devices."
			>
				<form
					onSubmit={addPasskey}
					className="mb-6 flex flex-col gap-3 sm:max-w-sm"
				>
					<Label htmlFor="pk-name">Name this passkey</Label>
					<Input id="pk-name" name="name" placeholder="MacBook Touch ID" />
					<Button type="submit" className="w-fit">
						<Fingerprint className="mr-1.5 h-4 w-4" />
						Add passkey
					</Button>
				</form>

				{passkeys.length === 0 ? (
					<p className="text-muted-foreground text-sm">No passkeys yet.</p>
				) : (
					<ul className="flex flex-col gap-2">
						{passkeys.map((pk) => (
							<li
								key={pk.id}
								className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
							>
								<span className="font-medium text-sm">
									{pk.name ?? "Passkey"}
								</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => removePasskey(pk.id)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</li>
						))}
					</ul>
				)}
			</Card>

			<Card
				title="Active sessions"
				description="Devices and browsers signed in to your account."
			>
				<div className="mb-4 flex items-center justify-between">
					<p className="text-muted-foreground text-sm">
						{sessions.length} session{sessions.length === 1 ? "" : "s"}
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={revokeAllOthers}
					>
						Revoke all others
					</Button>
				</div>
				<ul className="flex flex-col gap-2">
					{sessions.map((s) => (
						<li
							key={s.id}
							className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
						>
							<div className="min-w-0">
								<div className="truncate font-medium text-sm">
									{s.userAgent ?? "Unknown device"}
								</div>
								<div className="truncate text-muted-foreground text-xs">
									{s.ipAddress ?? "—"}
								</div>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => revokeSession(s.token)}
							>
								Revoke
							</Button>
						</li>
					))}
				</ul>
			</Card>
		</div>
	);
}
