"use client";

// Broadcaster's own profile editor. Display name, bio, pronouns. Hits
// admin.updateProfile via tRPC.

import { Button } from "@howlcast/ui/components/button";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export default function ProfileForm() {
	const queryClient = useQueryClient();
	const info = useQuery(trpc.channel.getInfo.queryOptions());
	const [displayName, setDisplayName] = useState("");
	const [bio, setBio] = useState("");
	const [pronouns, setPronouns] = useState("");

	useEffect(() => {
		if (info.data?.broadcaster) {
			setDisplayName(info.data.broadcaster.displayName ?? "");
			setBio(info.data.broadcaster.bio ?? "");
		}
	}, [info.data]);

	const update = useMutation(
		trpc.admin.updateProfile.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.channel.getInfo.queryKey() });
				toast.success("Profile updated.");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function submit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		update.mutate({
			displayName: displayName.trim(),
			bio: bio.trim() || null,
			pronouns: pronouns.trim() || null,
		});
	}

	return (
		<section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
			<header className="border-border border-b pb-3">
				<h2 className="font-display font-semibold text-foreground">Broadcaster profile</h2>
				<p className="mt-1 text-muted-foreground text-xs">
					Shown above the player and in the chat user card.
				</p>
			</header>
			<form onSubmit={submit} className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="pf-name">Display name</Label>
					<Input
						id="pf-name"
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						maxLength={40}
						required
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="pf-pronouns">Pronouns</Label>
					<Input
						id="pf-pronouns"
						value={pronouns}
						onChange={(e) => setPronouns(e.target.value)}
						maxLength={40}
						placeholder="they/them, she/her, …"
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="pf-bio">Bio</Label>
					<textarea
						id="pf-bio"
						value={bio}
						onChange={(e) => setBio(e.target.value)}
						rows={5}
						maxLength={500}
						className="rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground/60"
					/>
				</div>
				<Button type="submit" disabled={update.isPending} className="self-start">
					{update.isPending ? "Saving…" : "Save profile"}
				</Button>
			</form>
		</section>
	);
}
