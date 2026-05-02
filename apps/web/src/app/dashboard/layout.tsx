import { headers } from "next/headers";
import { redirect } from "next/navigation";

import Sidebar from "@/components/dashboard/sidebar";
import { authClient } from "@/lib/auth-client";

// Dashboard root layout. Three guards before the shell renders:
//   1. Session required (redirect to /login)
//   2. Setup must be complete (redirect to /setup)
//   3. profiles.role === "broadcaster" (redirect to / for non-broadcasters)
//
// Reads channel info via the existing API rather than touching the DB
// directly: server components in Next.js can't bundle cloudflare:workers
// imports (Turbopack errors on the external module), so we go through the
// tRPC fetch path. Same edge worker, same binding underneath, slightly
// more cycles but build-clean.

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000";

type ChannelInfo = {
	setupCompleted: boolean;
	broadcaster: { userId: string; displayName: string; verified: boolean } | null;
};

async function getChannelInfo(headerList: Headers): Promise<ChannelInfo | null> {
	const cookie = headerList.get("cookie") ?? "";
	const res = await fetch(`${SERVER_URL}/api/trpc/channel.getInfo`, {
		headers: { cookie, accept: "application/json" },
		cache: "no-store",
	});
	if (!res.ok) return null;
	const json = (await res.json()) as { result?: { data?: ChannelInfo } };
	return json.result?.data ?? null;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const headerList = await headers();
	const session = await authClient.getSession({
		fetchOptions: { headers: headerList },
	});
	if (!session?.data?.user) {
		redirect("/login");
	}

	const info = await getChannelInfo(headerList);
	if (!info?.setupCompleted) {
		redirect("/setup");
	}
	if (!info.broadcaster || info.broadcaster.userId !== session.data.user.id) {
		redirect("/");
	}

	return (
		<div className="grid min-h-svh grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
			<Sidebar displayName={info.broadcaster.displayName} verified={info.broadcaster.verified} />
			<div className="flex min-w-0 flex-col gap-6 px-6 py-6 lg:px-8 lg:py-8">{children}</div>
		</div>
	);
}
