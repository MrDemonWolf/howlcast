"use client";

// Logo + platform name + footer attribution. Single form, mutates via
// branding.update. Logo upload goes through /api/upload/logo (multipart)
// not tRPC so the bytes can stream directly to R2.

import { Button } from "@howlcast/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@howlcast/ui/components/card";
import { Input } from "@howlcast/ui/components/input";
import { Label } from "@howlcast/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Upload } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useWhiteLabel } from "@/lib/use-white-label";
import { trpc } from "@/utils/trpc";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "";
type Attribution = "default" | "custom" | "off";

export default function BrandingForm() {
	const queryClient = useQueryClient();
	const wl = useWhiteLabel();
	const branding = useQuery(trpc.branding.get.queryOptions());
	const fileInput = useRef<HTMLInputElement | null>(null);
	const [uploading, setUploading] = useState(false);

	const [platformName, setPlatformName] = useState("");
	const [attribution, setAttribution] = useState<Attribution>("default");
	const [customFooterText, setCustomFooterText] = useState("");

	useEffect(() => {
		if (branding.data) {
			setPlatformName(branding.data.platformName === "HowlCast" ? "" : branding.data.platformName);
			setAttribution(branding.data.footerAttribution as Attribution);
			setCustomFooterText(branding.data.customFooterText ?? "");
		}
	}, [branding.data]);

	const update = useMutation(
		trpc.branding.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.branding.get.queryKey() });
				toast.success("Branding saved.");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function submit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		update.mutate({
			customPlatformName: platformName.trim() || null,
			footerAttribution: attribution,
			customFooterText: attribution === "custom" ? customFooterText.trim() || null : null,
		});
	}

	async function onPickLogo(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > 1_000_000) {
			toast.error("Logo must be under 1 MB.");
			return;
		}
		setUploading(true);
		try {
			const fd = new FormData();
			fd.set("file", file);
			const res = await fetch(`${SERVER_URL}/api/upload/logo`, {
				method: "POST",
				body: fd,
				credentials: "include",
			});
			if (!res.ok) throw new Error(await res.text().catch(() => "upload failed"));
			toast.success("Logo updated.");
			queryClient.invalidateQueries({ queryKey: trpc.branding.get.queryKey() });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Upload failed.");
		} finally {
			setUploading(false);
			if (fileInput.current) fileInput.current.value = "";
		}
	}

	async function resetLogo() {
		update.mutate({ customLogoKey: null });
	}

	return (
		<Card>
			<form onSubmit={submit} className="contents">
				<CardHeader className="flex flex-row items-center gap-2 border-b pb-3">
					<ImageIcon className="h-4 w-4 text-cyan" aria-hidden />
					<CardTitle className="font-display font-semibold text-foreground">
						Logo &amp; platform name
					</CardTitle>
				</CardHeader>

				<CardContent className="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
					<div className="flex flex-col items-center gap-2">
						{}
						<img
							src={wl.logoUrl}
							alt="Current logo"
							className="h-16 w-16 rounded-md border border-border bg-bg-2 object-contain p-2"
						/>
						<input
							ref={fileInput}
							type="file"
							accept="image/svg+xml,image/png,image/jpeg"
							onChange={onPickLogo}
							className="hidden"
						/>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => fileInput.current?.click()}
							disabled={uploading}
						>
							<Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden />
							{uploading ? "Uploading…" : "Upload"}
						</Button>
						{wl.hasCustomLogo ? (
							<button
								type="button"
								onClick={resetLogo}
								className="text-fg-3 text-xs hover:text-foreground"
							>
								Reset to default
							</button>
						) : null}
					</div>

					<div className="flex flex-col gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="b-name">Platform name</Label>
							<Input
								id="b-name"
								value={platformName}
								onChange={(e) => setPlatformName(e.target.value)}
								placeholder="HowlCast"
								maxLength={24}
							/>
							<p className="text-fg-3 text-xs">
								Shown in the nav, emails, and OG image. Leave blank to use the default.
							</p>
						</div>

						<fieldset className="flex flex-col gap-1.5">
							<legend className="font-medium text-foreground text-sm">Footer attribution</legend>
							<label className="flex items-start gap-2 text-foreground text-sm">
								<input
									type="radio"
									name="attr"
									className="mt-1"
									checked={attribution === "default"}
									onChange={() => setAttribution("default")}
								/>
								<span>
									<span className="font-medium">Default</span>
									<span className="block text-fg-3 text-xs">
										"Powered by {platformName.trim() || "HowlCast"} by MrDemonWolf, Inc."
									</span>
								</span>
							</label>
							<label className="flex items-start gap-2 text-foreground text-sm">
								<input
									type="radio"
									name="attr"
									className="mt-1"
									checked={attribution === "custom"}
									onChange={() => setAttribution("custom")}
								/>
								<span>
									<span className="font-medium">Custom</span>
									<Input
										value={customFooterText}
										onChange={(e) => setCustomFooterText(e.target.value)}
										placeholder="Powered by Acme Co."
										maxLength={80}
										disabled={attribution !== "custom"}
										className="mt-1"
									/>
								</span>
							</label>
							<label className="flex items-start gap-2 text-foreground text-sm">
								<input
									type="radio"
									name="attr"
									className="mt-1"
									checked={attribution === "off"}
									onChange={() => setAttribution("off")}
								/>
								<span>
									<span className="font-medium">Off</span>
									<span className="block text-fg-3 text-xs">No footer attribution shown.</span>
								</span>
							</label>
						</fieldset>
					</div>
				</CardContent>

				<CardFooter className="justify-end">
					<Button type="submit" disabled={update.isPending}>
						{update.isPending ? "Saving…" : "Save branding"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
