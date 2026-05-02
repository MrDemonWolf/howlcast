"use client";

// Title + visibility editor. Both fields autosave on blur via
// channel.updateConfig. Optimistic update via tanstack-query so the
// UI doesn't flicker waiting for the round trip.

import { Button } from "@howlcast/ui/components/button";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Pencil, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export default function TitleForm() {
	const queryClient = useQueryClient();
	const info = useQuery(trpc.channel.getInfo.queryOptions());
	const [title, setTitle] = useState("");
	const [visibility, setVisibility] = useState<"public" | "invite_only">("invite_only");

	useEffect(() => {
		if (info.data) {
			setTitle(info.data.title ?? "");
			setVisibility(info.data.visibility);
		}
	}, [info.data]);

	const update = useMutation(
		trpc.channel.updateConfig.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.channel.getInfo.queryKey() });
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function commitTitle() {
		const next = title.trim() || null;
		if (next === (info.data?.title ?? null)) return;
		update.mutate({ title: next });
	}

	function setMode(next: "public" | "invite_only") {
		if (next === visibility) return;
		setVisibility(next);
		update.mutate({ visibility: next });
	}

	return (
		<section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
			<header className="flex items-center gap-2 border-border border-b pb-3">
				<Pencil className="h-4 w-4 text-cyan" aria-hidden />
				<h2 className="font-display font-semibold text-foreground">Stream details</h2>
			</header>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="dl-title">Title</Label>
				<Input
					id="dl-title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					onBlur={commitTitle}
					maxLength={140}
					placeholder="What's the stream about?"
				/>
				<p className="text-muted-foreground text-xs">Saves automatically on blur.</p>
			</div>

			<fieldset className="flex flex-col gap-1.5">
				<Label>Visibility</Label>
				<div className="grid grid-cols-2 gap-2">
					<Button
						type="button"
						variant={visibility === "invite_only" ? "default" : "outline"}
						onClick={() => setMode("invite_only")}
						disabled={update.isPending}
						className="justify-start"
					>
						<Lock className="mr-1.5 h-3.5 w-3.5" aria-hidden />
						Invite-only
					</Button>
					<Button
						type="button"
						variant={visibility === "public" ? "default" : "outline"}
						onClick={() => setMode("public")}
						disabled={update.isPending}
						className="justify-start"
					>
						<Users className="mr-1.5 h-3.5 w-3.5" aria-hidden />
						Public
					</Button>
				</div>
			</fieldset>
		</section>
	);
}
