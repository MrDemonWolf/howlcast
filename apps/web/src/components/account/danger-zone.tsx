"use client";

// Account deletion. Broadcaster cannot self-delete (would orphan the
// channel) — the server returns PRECONDITION_FAILED and we surface that
// inline. Two-step confirm so a stray click can't nuke the account.

import { Button } from "@howlcast/ui/components/button";
import { Input } from "@howlcast/ui/components/input";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export default function DangerZone({
	confirmPhrase = "delete my account",
}: {
	confirmPhrase?: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [typed, setTyped] = useState("");

	const del = useMutation(
		trpc.account.deleteMe.mutationOptions({
			onSuccess: () => {
				toast.success("Account deleted.");
				router.push("/" as never);
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	return (
		<section className="flex flex-col gap-3 rounded-lg border border-live/40 bg-live/5 p-5">
			<header className="flex items-center gap-2 border-live/30 border-b pb-3">
				<AlertTriangle className="h-4 w-4 text-live" aria-hidden />
				<h2 className="font-display font-semibold text-foreground">Danger zone</h2>
			</header>
			<p className="text-muted-foreground text-sm">
				Permanently delete your account, profile, and all sessions. This can't be undone.
			</p>
			{!open ? (
				<Button
					type="button"
					variant="destructive"
					size="sm"
					onClick={() => setOpen(true)}
					className="self-start"
				>
					Delete my account
				</Button>
			) : (
				<div className="flex flex-col gap-2">
					<p className="text-foreground text-sm">
						Type{" "}
						<code className="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-xs">{confirmPhrase}</code>{" "}
						to confirm.
					</p>
					<Input
						value={typed}
						onChange={(e) => setTyped(e.target.value)}
						placeholder={confirmPhrase}
						aria-label="Type the confirmation phrase"
					/>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="destructive"
							size="sm"
							disabled={typed !== confirmPhrase || del.isPending}
							onClick={() => del.mutate()}
						>
							{del.isPending ? "Deleting…" : "Confirm delete"}
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								setOpen(false);
								setTyped("");
							}}
						>
							Cancel
						</Button>
					</div>
				</div>
			)}
		</section>
	);
}
