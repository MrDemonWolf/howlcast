"use client";

// User-facing profile editor (works for both viewers and broadcasters).
// Uses account.updateProfile which is scoped to the calling user only.

import { Button } from "@howlcast/ui/components/button";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export default function AccountProfileForm() {
	const queryClient = useQueryClient();
	const me = useQuery(trpc.account.me.queryOptions());
	const [displayName, setDisplayName] = useState("");
	const [pronouns, setPronouns] = useState("");
	const [bio, setBio] = useState("");

	useEffect(() => {
		if (me.data?.profile) {
			setDisplayName(me.data.profile.displayName);
			setPronouns(me.data.profile.pronouns ?? "");
			setBio(me.data.profile.bio ?? "");
		}
	}, [me.data]);

	const update = useMutation(
		trpc.account.updateProfile.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.account.me.queryKey() });
				toast.success("Profile updated.");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function submit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		update.mutate({
			displayName: displayName.trim() || undefined,
			pronouns: pronouns.trim() || null,
			bio: bio.trim() || null,
		});
	}

	const isBroadcaster = me.data?.profile?.role === "broadcaster";

	return (
		<section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
			<header className="border-border border-b pb-3">
				<h2 className="font-display font-semibold text-foreground">Profile</h2>
				<p className="mt-1 text-muted-foreground text-xs">
					{isBroadcaster
						? "This is the public-facing profile shown above the player and in chat."
						: "Shown next to your messages in chat."}
				</p>
			</header>
			<form onSubmit={submit} className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="ap-name">Display name</Label>
					<Input
						id="ap-name"
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						maxLength={40}
						required
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="ap-pronouns">Pronouns</Label>
					<Input
						id="ap-pronouns"
						value={pronouns}
						onChange={(e) => setPronouns(e.target.value)}
						placeholder="they/them"
						maxLength={40}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="ap-bio">Bio</Label>
					<textarea
						id="ap-bio"
						value={bio}
						onChange={(e) => setBio(e.target.value)}
						maxLength={500}
						rows={4}
						className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40"
					/>
				</div>
				<div className="flex justify-end">
					<Button type="submit" disabled={update.isPending}>
						{update.isPending ? "Saving…" : "Save"}
					</Button>
				</div>
			</form>
		</section>
	);
}
