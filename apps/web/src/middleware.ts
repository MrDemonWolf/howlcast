// Routing gate. Two modes:
//
//   • Pre-setup (channelConfig.setupCompletedAt IS NULL):
//       Everyone — auth'd or not — gets routed to /setup.
//       The wizard is the only useful surface.
//   • Post-setup:
//       Anonymous viewers pass through (so they can watch the public
//       stream from the channel page).
//       Signed-in users only get redirected to /setup if somehow the
//       state stayed null (shouldn't happen post-completion).
//
// Setup status is fetched from the API and cached in module memory for
// 60s so middleware stays fast.

import { type NextRequest, NextResponse } from "next/server";

const SETUP_STATUS_TTL_MS = 60_000;
let cachedStatus: { setupCompleted: boolean; cachedAt: number } | null = null;

async function getSetupStatus(req: NextRequest): Promise<boolean> {
	const now = Date.now();
	if (cachedStatus && now - cachedStatus.cachedAt < SETUP_STATUS_TTL_MS) {
		return cachedStatus.setupCompleted;
	}
	try {
		const url = new URL("/api/trpc/setup.getStatus", req.nextUrl.origin);
		const res = await fetch(url, { headers: { accept: "application/json" } });
		if (!res.ok) return true; // fail-open — never lock the user out
		const json = (await res.json()) as { result?: { data?: { setupCompleted?: boolean } } };
		const setupCompleted = !!json.result?.data?.setupCompleted;
		cachedStatus = { setupCompleted, cachedAt: now };
		return setupCompleted;
	} catch {
		return true;
	}
}

export async function middleware(req: NextRequest) {
	const setupCompleted = await getSetupStatus(req);

	// Pre-setup: send everyone to /setup. Login/signup are inert.
	if (!setupCompleted) {
		const url = req.nextUrl.clone();
		url.pathname = "/setup";
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	// Pre-setup: covers the home page, login, and dashboard so a fresh
	// deploy funnels everyone to /setup. Post-setup: only `/` and
	// `/dashboard*` need this — no-ops for anonymous viewers.
	matcher: ["/", "/login", "/dashboard/:path*"],
};
