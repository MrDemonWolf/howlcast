"use client";

// Panels editor. Add / edit / delete / reorder cards that show below
// the player on the channel page. Reorder uses up/down buttons (no
// drag library — keeps the bundle small; fine for ~10 panels max).

import { Button } from "@howlcast/ui/components/button";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type Panel = {
	id: string;
	position: number;
	title: string | null;
	body: string | null;
	imageKey: string | null;
	linkUrl: string | null;
};

type EditorState = { kind: "idle" } | { kind: "edit"; panel: Panel } | { kind: "create" };

export default function PanelsEditor() {
	const queryClient = useQueryClient();
	const list = useQuery(trpc.channel.getPanels.queryOptions());
	const [editor, setEditor] = useState<EditorState>({ kind: "idle" });

	const upsert = useMutation(
		trpc.channel.upsertPanel.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.channel.getPanels.queryKey() });
				setEditor({ kind: "idle" });
				toast.success("Panel saved.");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const remove = useMutation(
		trpc.channel.deletePanel.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.channel.getPanels.queryKey() });
				toast.success("Panel removed.");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const reorder = useMutation(
		trpc.channel.reorderPanels.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.channel.getPanels.queryKey() });
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const panels = list.data ?? [];

	function move(idx: number, dir: -1 | 1) {
		const next = [...panels];
		const target = idx + dir;
		if (target < 0 || target >= next.length) return;
		const a = next[idx];
		const b = next[target];
		if (!a || !b) return;
		next[idx] = b;
		next[target] = a;
		reorder.mutate({ ids: next.map((p) => p.id) });
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<p className="text-muted-foreground text-sm">
					Panels show below the player on the channel page. Up to ~10 looks tidy.
				</p>
				<Button type="button" size="sm" onClick={() => setEditor({ kind: "create" })}>
					<Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
					Add panel
				</Button>
			</div>

			{panels.length === 0 ? (
				<div className="rounded-[var(--radius-lg)] border border-border border-dashed bg-card p-8 text-center text-muted-foreground text-sm">
					No panels yet. Add one to get started.
				</div>
			) : (
				<ul className="flex flex-col gap-2">
					{panels.map((p, idx) => (
						<li
							key={p.id}
							className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-card p-3"
						>
							<div className="flex flex-none flex-col">
								<button
									type="button"
									aria-label="Move up"
									disabled={idx === 0 || reorder.isPending}
									onClick={() => move(idx, -1)}
									className="text-fg-3 hover:text-foreground disabled:opacity-30"
								>
									<ArrowUp className="h-4 w-4" />
								</button>
								<button
									type="button"
									aria-label="Move down"
									disabled={idx === panels.length - 1 || reorder.isPending}
									onClick={() => move(idx, 1)}
									className="text-fg-3 hover:text-foreground disabled:opacity-30"
								>
									<ArrowDown className="h-4 w-4" />
								</button>
							</div>
							<div className="min-w-0 flex-1">
								<div className="truncate font-medium text-foreground text-sm">
									{p.title ?? <em className="text-muted-foreground">(untitled)</em>}
								</div>
								{p.body ? (
									<div className="truncate text-muted-foreground text-xs">{p.body}</div>
								) : null}
							</div>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={() => setEditor({ kind: "edit", panel: p })}
								aria-label="Edit panel"
							>
								<Pencil className="h-3.5 w-3.5" />
							</Button>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={() => {
									if (confirm("Delete this panel?")) remove.mutate({ id: p.id });
								}}
								aria-label="Delete panel"
							>
								<Trash2 className="h-3.5 w-3.5 text-destructive" />
							</Button>
						</li>
					))}
				</ul>
			)}

			{editor.kind !== "idle" ? (
				<PanelEditorDrawer
					initial={editor.kind === "edit" ? editor.panel : null}
					onClose={() => setEditor({ kind: "idle" })}
					onSubmit={(data) =>
						upsert.mutate({
							id: data.id,
							title: data.title || null,
							body: data.body || null,
							imageKey: null,
							linkUrl: data.linkUrl || null,
						})
					}
					submitting={upsert.isPending}
				/>
			) : null}
		</div>
	);
}

type DrawerInput = {
	id: string;
	title: string;
	body: string;
	linkUrl: string;
};

function PanelEditorDrawer({
	initial,
	onClose,
	onSubmit,
	submitting,
}: {
	initial: Panel | null;
	onClose: () => void;
	onSubmit: (data: DrawerInput) => void;
	submitting: boolean;
}) {
	const [title, setTitle] = useState(initial?.title ?? "");
	const [body, setBody] = useState(initial?.body ?? "");
	const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? "");

	function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		onSubmit({
			id: initial?.id ?? crypto.randomUUID(),
			title: title.trim(),
			body: body.trim(),
			linkUrl: linkUrl.trim(),
		});
	}

	return (
		<div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
			<div className="flex h-full w-full max-w-md flex-col border-border border-l bg-bg">
				<header className="flex items-center justify-between border-border border-b px-5 py-4">
					<h3 className="font-display font-semibold text-foreground">
						{initial ? "Edit panel" : "Add panel"}
					</h3>
					<Button type="button" size="sm" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
				</header>
				<form onSubmit={handle} className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="p-title">Title</Label>
						<Input
							id="p-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							maxLength={80}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="p-body">Body</Label>
						<textarea
							id="p-body"
							value={body}
							onChange={(e) => setBody(e.target.value)}
							rows={8}
							maxLength={2000}
							className="rounded-md border border-input bg-background px-3 py-2 font-mono text-foreground text-sm placeholder:text-muted-foreground/60"
							placeholder="Markdown welcome. Plain text works too."
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="p-link">Link URL (optional)</Label>
						<Input
							id="p-link"
							type="url"
							value={linkUrl}
							onChange={(e) => setLinkUrl(e.target.value)}
							maxLength={500}
							placeholder="https://"
						/>
					</div>
					<div className="mt-auto flex gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={submitting}
							className="flex-1"
						>
							Cancel
						</Button>
						<Button type="submit" disabled={submitting} className="flex-1">
							{submitting ? "Saving…" : initial ? "Save changes" : "Add panel"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
