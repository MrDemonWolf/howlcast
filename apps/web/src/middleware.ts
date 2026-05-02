// Setup-gate middleware. Wraps the home page (/) and /dashboard:
//
//  • Anonymous viewers always pass through — they can still watch the
//    public stream from the channel page even before setup.
//  • Signed-in users hit `setup.getStatus`; if setup hasn't completed
//    they're redirected to /setup. The wizard itself is excluded so the
//    redirect doesn't loop.
//
// Phase 5.1 will extend this with a broadcaster-role check on /dashboard.

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
		if (!res.ok) return true; // fail-open — don't lock people out on transient failures
		const json = (await res.json()) as { result?: { data?: { setupCompleted?: boolean } } };
		const setupCompleted = !!json.result?.data?.setupCompleted;
		cachedStatus = { setupCompleted, cachedAt: now };
		return setupCompleted;
	} catch {
		return true;
	}
}

export async function middleware(req: NextRequest) {
	// Cheap session-presence sniff: better-auth drops a cookie prefixed
	// `__Secure-better-auth.session_token` (or `better-auth.session_token`
	// on insecure dev). Skip the redirect for guests.
	const cookieHeader = req.headers.get("cookie") ?? "";
	const hasSession = /better-auth\.session_token/.test(cookieHeader);
	if (!hasSession) return NextResponse.next();

	const setupCompleted = await getSetupStatus(req);
	if (!setupCompleted) {
		const url = req.nextUrl.clone();
		url.pathname = "/setup";
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/", "/dashboard/:path*"],
};
