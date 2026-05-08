"use client";

// Tiptap WYSIWYG for /privacy and /terms. Server sanitizes on save via
// rehype-sanitize so anything the editor lets through but we don't trust
// (script tags, inline event handlers, weird protocols) gets stripped
// before it ever hits the DB.

import { Button } from "@howlcast/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@howlcast/ui/components/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExt from "@tiptap/extension-link";
import {
	Bold,
	FileText,
	Heading1,
	Heading2,
	Italic,
	Link as LinkIcon,
	List,
	ListOrdered,
	Redo,
	Undo,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type LegalId = "privacy" | "terms";

export default function LegalEditor() {
	const [activeId, setActiveId] = useState<LegalId>("privacy");

	return (
		<Card>
			<CardHeader className="flex flex-row items-center gap-2 border-b pb-3">
				<FileText className="h-4 w-4 text-cyan" aria-hidden />
				<CardTitle className="font-display font-semibold text-foreground">
					Privacy &amp; Terms
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<div className="flex gap-1 rounded-md bg-bg-2 p-1 text-sm">
					<TabButton active={activeId === "privacy"} onClick={() => setActiveId("privacy")}>
						Privacy Policy
					</TabButton>
					<TabButton active={activeId === "terms"} onClick={() => setActiveId("terms")}>
						Terms of Service
					</TabButton>
				</div>

				<EditorPanel id={activeId} />
			</CardContent>
		</Card>
	);
}

function TabButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex-1 rounded px-3 py-1.5 transition ${
				active ? "bg-bg-3 text-foreground" : "text-fg-3 hover:text-foreground"
			}`}
		>
			{children}
		</button>
	);
}

function EditorPanel({ id }: { id: LegalId }) {
	const queryClient = useQueryClient();
	const doc = useQuery(trpc.branding.getLegal.queryOptions({ id }));
	const [dirty, setDirty] = useState(false);

	const editor = useEditor(
		{
			extensions: [
				StarterKit,
				LinkExt.configure({
					openOnClick: false,
					autolink: true,
				}),
			],
			content: "",
			immediatelyRender: false,
			editorProps: {
				attributes: {
					class:
						"howlcast-prose min-h-[280px] focus:outline-none rounded-md border border-border bg-bg-2 px-3 py-2",
				},
			},
			onUpdate() {
				setDirty(true);
			},
		},
		[id],
	);

	useEffect(() => {
		if (editor && doc.data) {
			editor.commands.setContent(doc.data.bodyHtml);
			setDirty(false);
		}
	}, [editor, doc.data]);

	const save = useMutation(
		trpc.branding.updateLegal.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.branding.getLegal.queryKey({ id }),
				});
				toast.success(`${id === "privacy" ? "Privacy" : "Terms"} saved.`);
				setDirty(false);
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function commit() {
		if (!editor) return;
		save.mutate({ id, bodyHtml: editor.getHTML() });
	}

	function discard() {
		if (!editor || !doc.data) return;
		editor.commands.setContent(doc.data.bodyHtml);
		setDirty(false);
	}

	function promptLink() {
		const prev = editor?.getAttributes("link").href as string | undefined;
		const url = window.prompt("URL", prev ?? "https://");
		if (url === null) return;
		if (url === "") {
			editor?.chain().focus().unsetLink().run();
			return;
		}
		editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	}

	if (doc.isLoading) {
		return <div className="text-muted-foreground text-sm">Loading…</div>;
	}

	if (!editor) return null;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-bg-2 p-1">
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBold().run()}
					active={editor.isActive("bold")}
					title="Bold"
				>
					<Bold className="h-3.5 w-3.5" aria-hidden />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleItalic().run()}
					active={editor.isActive("italic")}
					title="Italic"
				>
					<Italic className="h-3.5 w-3.5" aria-hidden />
				</ToolbarButton>
				<Sep />
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
					active={editor.isActive("heading", { level: 1 })}
					title="Heading 1"
				>
					<Heading1 className="h-3.5 w-3.5" aria-hidden />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					active={editor.isActive("heading", { level: 2 })}
					title="Heading 2"
				>
					<Heading2 className="h-3.5 w-3.5" aria-hidden />
				</ToolbarButton>
				<Sep />
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					active={editor.isActive("bulletList")}
					title="Bullet list"
				>
					<List className="h-3.5 w-3.5" aria-hidden />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					active={editor.isActive("orderedList")}
					title="Numbered list"
				>
					<ListOrdered className="h-3.5 w-3.5" aria-hidden />
				</ToolbarButton>
				<Sep />
				<ToolbarButton onClick={promptLink} active={editor.isActive("link")} title="Link">
					<LinkIcon className="h-3.5 w-3.5" aria-hidden />
				</ToolbarButton>
				<Sep />
				<ToolbarButton
					onClick={() => editor.chain().focus().undo().run()}
					active={false}
					title="Undo"
				>
					<Undo className="h-3.5 w-3.5" aria-hidden />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().redo().run()}
					active={false}
					title="Redo"
				>
					<Redo className="h-3.5 w-3.5" aria-hidden />
				</ToolbarButton>
			</div>

			<EditorContent editor={editor} />

			<div className="flex items-center justify-between gap-3">
				<p className="text-fg-3 text-xs">
					{doc.data?.updatedAt
						? `Last edited ${new Date(doc.data.updatedAt).toLocaleString()}`
						: "Not yet saved."}{" "}
					· Visible at /{id}
				</p>
				<div className="flex gap-2">
					<Button type="button" variant="outline" size="sm" onClick={discard} disabled={!dirty}>
						Discard
					</Button>
					<Button type="button" size="sm" onClick={commit} disabled={!dirty || save.isPending}>
						{save.isPending ? "Saving…" : "Save & publish"}
					</Button>
				</div>
			</div>
		</div>
	);
}

function ToolbarButton({
	onClick,
	active,
	title,
	children,
}: {
	onClick: () => void;
	active: boolean;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			className={`grid h-7 w-7 place-items-center rounded transition ${
				active ? "bg-cyan/20 text-cyan" : "text-fg-2 hover:bg-bg-3 hover:text-foreground"
			}`}
		>
			{children}
		</button>
	);
}

function Sep() {
	return <span className="mx-1 h-4 w-px bg-border" aria-hidden />;
}
