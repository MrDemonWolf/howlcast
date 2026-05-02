import { headers } from "next/headers";
import { redirect } from "next/navigation";

import Sidebar from "@/components/dashboard/sidebar";
import { authClient } from "@/lib/auth-client";

import { createDb } from "@howlcast/db";
import { channelConfig, profiles } from "@howlcast/db/schema";
import { eq } from "drizzle-orm";

// Dashboard root layout. Three guards before the shell renders:
//   1. Session required (redirect to /login)
//   2. Setup must be complete (redirect to /setup; middleware handles
//      this for non-/dashboard routes too — defense in depth)
//   3. profiles.role === "broadcaster" (redirect to / if a viewer wanders in)
//
// We hit the DB directly here instead of tRPC — the layout is a server
// component running on the same edge worker as the API, so the round trip
// is just a binding fetch.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const session = await authClient.getSession({
		fetchOptions: { headers: await headers() },
	});
	if (!session?.data?.user) {
		redirect("/login");
	}

	const db = createDb();
	const cfg = await db.select().from(channelConfig).where(eq(channelConfig.id, "site")).get();
	if (!cfg?.setupCompletedAt) {
		redirect("/setup");
	}

	const profile = await db
		.select()
		.from(profiles)
		.where(eq(profiles.userId, session.data.user.id))
		.get();
	if (profile?.role !== "broadcaster") {
		redirect("/");
	}

	return (
		<div className="grid min-h-svh grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
			<Sidebar
				displayName={profile.displayName ?? session.data.user.name}
				verified={profile.verified ?? false}
			/>
			<div className="flex min-w-0 flex-col gap-6 px-6 py-6 lg:px-8 lg:py-8">{children}</div>
		</div>
	);
}
