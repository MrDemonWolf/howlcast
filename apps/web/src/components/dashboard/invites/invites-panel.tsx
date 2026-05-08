"use client";

// Invite emails. Single template — broadcaster types an email, we send
// a magic-link invite that creates a viewer account on accept. List of
// outstanding invites + revoke. No SQL or env vars to manage.

import { Button } from "@howlcast/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@howlcast/ui/components/card";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export default function InvitesPanel() {
	const queryClient = useQueryClient();
	const list = useQuery(trpc.admin.listInvites.queryOptions());
	const [email, setEmail] = useState("");

	const create = useMutation(
		trpc.admin.createInvite.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.admin.listInvites.queryKey() });
				setEmail("");
				toast.success(`Invite sent to ${email}.`);
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const revoke = useMutation(
		trpc.admin.revokeInvite.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.admin.listInvites.queryKey() });
				toast.success("Invite revoked.");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function submit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const v = email.trim();
		if (!v) return;
		create.mutate({ email: v });
	}

	const invites = list.data ?? [];

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<CardHeader className="flex flex-row items-center gap-2 border-b pb-3">
					<Mail className="h-4 w-4 text-cyan" aria-hidden />
					<CardTitle className="font-display font-semibold text-foreground">
						Send an invite
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
						<div className="flex flex-1 flex-col gap-1.5">
							<Label htmlFor="inv-email">Email address</Label>
							<Input
								id="inv-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="friend@example.com"
								required
							/>
						</div>
						<Button type="submit" disabled={create.isPending}>
							{create.isPending ? "Sending…" : "Send invite"}
						</Button>
					</form>
					<p className="text-muted-foreground text-xs">
						They'll get a magic-link email. Click it to create their viewer account with chat
						access. Links expire in 30 days.
					</p>
				</CardContent>
			</Card>

			<section className="flex flex-col gap-3">
				<h2 className="font-display font-semibold text-foreground">Outstanding invites</h2>
				{invites.length === 0 ? (
					<div className="rounded-[var(--radius-lg)] border border-border border-dashed bg-card p-6 text-center text-muted-foreground text-sm">
						No invites sent yet.
					</div>
				) : (
					<ul className="flex flex-col gap-2">
						{invites.map((i) => (
							<li
								key={i.code}
								className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-card p-3"
							>
								<div className="min-w-0 flex-1">
									<div className="font-mono text-foreground text-xs">{i.code.slice(0, 8)}…</div>
									<div className="text-muted-foreground text-xs">
										{i.usedAt
											? `Used ${new Date(i.usedAt).toLocaleDateString()}`
											: i.expiresAt && i.expiresAt < Date.now()
												? "Expired"
												: `Expires ${i.expiresAt ? new Date(i.expiresAt).toLocaleDateString() : "—"}`}
									</div>
								</div>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									onClick={() => {
										if (confirm("Revoke this invite?")) revoke.mutate({ code: i.code });
									}}
									aria-label="Revoke invite"
								>
									<Trash2 className="h-3.5 w-3.5 text-destructive" />
								</Button>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
