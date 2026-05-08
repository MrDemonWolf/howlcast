"use client";

// Stream-title editor. Autosaves on blur via channel.updateConfig.
// Optimistic invalidation via tanstack-query keeps the UI snappy.
// Visibility toggle was removed when public mode was retired — every
// den is invite-only by design.

import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export default function TitleForm() {
	const queryClient = useQueryClient();
	const info = useQuery(trpc.channel.getInfo.queryOptions());
	const [title, setTitle] = useState("");

	useEffect(() => {
		if (info.data) {
			setTitle(info.data.title ?? "");
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
		</section>
	);
}
