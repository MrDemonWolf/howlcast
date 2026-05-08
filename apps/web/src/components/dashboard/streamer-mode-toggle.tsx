"use client";

// Sidebar toggle for Streamer Mode. Flipping ON masks RTMPS / stream key /
// webhook URLs across the dashboard so the broadcaster can safely screen-
// share. Flipping OFF requires a confirm modal (matches design v2 prototype
// design-handoff/howcast-v2/project/chrome.jsx → SMConfirm).

import { Button } from "@howlcast/ui/components/button";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

import { setStreamerMode, useStreamerMode } from "@/lib/streamer-mode";

export function StreamerModeToggle() {
	const on = useStreamerMode();
	const [confirming, setConfirming] = useState(false);

	const handleClick = () => {
		if (on) setConfirming(true);
		else setStreamerMode(true);
	};

	return (
		<>
			<button
				type="button"
				onClick={handleClick}
				title={
					on ? "Streamer Mode is ON — secrets are hidden" : "Hide secrets while screen-sharing"
				}
				className="flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left text-sm transition"
				style={{
					background: on ? "color-mix(in oklab, var(--cyan) 14%, transparent)" : "transparent",
					borderColor: on ? "color-mix(in oklab, var(--cyan) 45%, transparent)" : "var(--line)",
					color: on ? "var(--cyan)" : "var(--fg-2)",
				}}
				aria-pressed={on}
			>
				{on ? <EyeOff size={14} /> : <Eye size={14} />}
				<span className="flex-1">Streamer Mode</span>
				<span
					aria-hidden
					className="flex-none rounded-full border p-0.5"
					style={{
						width: 30,
						height: 16,
						background: on ? "var(--cyan)" : "var(--bg-4)",
						borderColor: "var(--line-2)",
					}}
				>
					<span
						className="block rounded-full transition-[margin]"
						style={{
							width: 10,
							height: 10,
							background: on ? "var(--cta-fg)" : "var(--fg-3)",
							marginLeft: on ? 14 : 0,
						}}
					/>
				</span>
			</button>

			{confirming && <RevealConfirm onCancel={() => setConfirming(false)} />}
		</>
	);
}

function RevealConfirm({ onCancel }: { onCancel: () => void }) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCancel();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onCancel]);

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="streamer-mode-confirm-title"
			className="fixed inset-0 z-[60] flex items-center justify-center p-6"
			style={{
				background: "color-mix(in oklab, var(--bg) 70%, black 30%)",
				backdropFilter: "blur(6px)",
			}}
			onClick={onCancel}
		>
			<div
				role="document"
				onClick={(e) => e.stopPropagation()}
				className="w-[420px] rounded-[var(--radius-lg)] border bg-[var(--bg-2)] p-6 shadow-2xl"
				style={{ borderColor: "var(--line)" }}
			>
				<div className="flex items-center gap-2.5">
					<span
						className="inline-flex h-9 w-9 items-center justify-center rounded-full"
						style={{
							background: "color-mix(in oklab, var(--warning) 18%, transparent)",
							color: "var(--warning)",
						}}
					>
						<Eye size={18} />
					</span>
					<h3
						id="streamer-mode-confirm-title"
						className="font-display font-bold text-lg"
						style={{ letterSpacing: "-0.02em" }}
					>
						Reveal sensitive info?
					</h3>
				</div>
				<p className="mt-3 text-[13.5px] text-[var(--fg-2)] leading-relaxed">
					Turning off Streamer Mode will un-blur your <strong>stream key</strong>,{" "}
					<strong>RTMPS server URL</strong>, and <strong>Discord webhook URLs</strong>. Make sure
					you're not screen-sharing or recording before continuing.
				</p>
				<div className="mt-4 flex justify-end gap-2">
					<Button variant="ghost" onClick={onCancel}>
						Keep hidden
					</Button>
					<Button
						variant="destructive"
						onClick={() => {
							setStreamerMode(false);
							onCancel();
						}}
					>
						Yes, reveal
					</Button>
				</div>
			</div>
		</div>
	);
}
