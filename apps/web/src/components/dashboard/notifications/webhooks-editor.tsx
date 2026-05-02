"use client";

// Two Discord webhooks (public + private). Per-row URL + notify
// toggles + lastFiredAt + lastError display.

import { Button } from "@howlcast/ui/components/button";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type Hook = {
	id: string;
	url: string | null;
	notifyOnLive: boolean;
	notifyOnEnd: boolean;
	lastFiredAt: number | null;
	lastError: string | null;
};

export default function WebhooksEditor() {
	const list = useQuery(trpc.admin.listWebhooks.queryOptions());
	if (list.isPending) return null;
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{(list.data ?? []).map((h) => (
				<WebhookCard key={h.id} hook={h} />
			))}
		</div>
	);
}

function WebhookCard({ hook }: { hook: Hook }) {
	const queryClient = useQueryClient();
	const [url, setUrl] = useState(hook.url ?? "");
	const [notifyOnLive, setNotifyOnLive] = useState(hook.notifyOnLive);
	const [notifyOnEnd, setNotifyOnEnd] = useState(hook.notifyOnEnd);

	useEffect(() => {
		setUrl(hook.url ?? "");
		setNotifyOnLive(hook.notifyOnLive);
		setNotifyOnEnd(hook.notifyOnEnd);
	}, [hook]);

	const save = useMutation(
		trpc.admin.upsertWebhook.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.admin.listWebhooks.queryKey() });
				toast.success(`${hook.id === "public" ? "Public" : "Private"} webhook saved.`);
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function commit() {
		save.mutate({
			id: hook.id as "public" | "private",
			url: url.trim() || null,
			notifyOnLive,
			notifyOnEnd,
		});
	}

	return (
		<section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
			<header className="flex items-center gap-2 border-border border-b pb-3">
				<BellRing className="h-4 w-4 text-cyan" aria-hidden />
				<h2 className="font-display font-semibold text-foreground capitalize">{hook.id} channel</h2>
			</header>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor={`wh-${hook.id}`}>Discord webhook URL</Label>
				<Input
					id={`wh-${hook.id}`}
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					type="url"
					placeholder="https://discord.com/api/webhooks/…"
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="flex items-center gap-2 text-foreground text-sm">
					<input
						type="checkbox"
						checked={notifyOnLive}
						onChange={(e) => setNotifyOnLive(e.target.checked)}
					/>
					Notify when live starts
				</label>
				<label className="flex items-center gap-2 text-foreground text-sm">
					<input
						type="checkbox"
						checked={notifyOnEnd}
						onChange={(e) => setNotifyOnEnd(e.target.checked)}
					/>
					Notify when stream ends
				</label>
			</div>

			{hook.lastFiredAt ? (
				<p className="text-muted-foreground text-xs">
					Last fired: {new Date(hook.lastFiredAt).toLocaleString()}
				</p>
			) : null}
			{hook.lastError ? (
				<p className="rounded-md border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-destructive text-xs">
					Last error: {hook.lastError}
				</p>
			) : null}

			<Button type="button" onClick={commit} disabled={save.isPending} className="self-start">
				{save.isPending ? "Saving…" : "Save"}
			</Button>
		</section>
	);
}
