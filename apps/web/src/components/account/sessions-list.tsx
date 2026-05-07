"use client";

// Active sessions for the signed-in user. Lets them sign out other devices
// without going through the security page.

import { Button } from "@howlcast/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Monitor } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export default function SessionsList() {
	const queryClient = useQueryClient();
	const sessions = useQuery(trpc.account.listSessions.queryOptions());
	const revoke = useMutation(
		trpc.account.revokeSession.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.account.listSessions.queryKey() });
				toast.success("Session revoked.");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	return (
		<section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
			<header className="flex items-center gap-2 border-border border-b pb-3">
				<Monitor className="h-4 w-4 text-cyan" aria-hidden />
				<h2 className="font-display font-semibold text-foreground">Active sessions</h2>
			</header>
			{sessions.isLoading ? (
				<p className="text-muted-foreground text-sm">Loading…</p>
			) : (sessions.data ?? []).length === 0 ? (
				<p className="text-muted-foreground text-sm">No active sessions.</p>
			) : (
				<ul className="flex flex-col gap-2">
					{sessions.data!.map((s) => (
						<li
							key={s.id}
							className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg-2 p-3 text-sm"
						>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span className="truncate font-medium text-foreground">
										{simplifyUserAgent(s.userAgent)}
									</span>
									{s.isCurrent ? (
										<span className="rounded bg-cyan/15 px-1.5 py-0.5 font-mono text-[9px] text-cyan uppercase tracking-wider">
											this device
										</span>
									) : null}
								</div>
								<p className="font-mono text-fg-3 text-xs">
									{s.ipAddress ?? "unknown ip"} ·{" "}
									{s.createdAt ? `started ${new Date(s.createdAt).toLocaleString()}` : "started ?"}
								</p>
							</div>
							{!s.isCurrent ? (
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => revoke.mutate({ sessionId: s.id })}
									disabled={revoke.isPending}
								>
									Revoke
								</Button>
							) : null}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function simplifyUserAgent(ua: string | null): string {
	if (!ua) return "Unknown device";
	if (/iPhone/.test(ua)) return "iPhone";
	if (/iPad/.test(ua)) return "iPad";
	if (/Android/.test(ua)) return "Android";
	if (/Mac OS X/.test(ua)) return "Mac";
	if (/Windows/.test(ua)) return "Windows";
	if (/Linux/.test(ua)) return "Linux";
	return "Browser";
}
