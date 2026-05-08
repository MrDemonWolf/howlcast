// Streams the active broadcaster logo from R2. Lives on the web worker
// (not apps/server) so next/image can optimize same-origin without an
// extra hop. The web worker already has DB + PUBLIC_BUCKET bindings.
//
// Path is /branding/logo, NOT /api/branding/logo — the latter is
// rewritten to the api worker by next.config.ts and would round-trip
// back out of Next.js.

import { createDb } from "@howlcast/db";
import { whiteLabel } from "@howlcast/db/schema";
import { env } from "@howlcast/env/server";
import { eq } from "drizzle-orm";

export async function GET() {
	const db = createDb();
	const row = await db.select().from(whiteLabel).where(eq(whiteLabel.id, "site")).get();
	const key = row?.customLogoKey;
	if (!key) {
		return new Response(JSON.stringify({ error: "no custom logo" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	const obj = await env.PUBLIC_BUCKET.get(key);
	if (!obj) {
		return new Response(JSON.stringify({ error: "missing object" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	const contentType =
		obj.httpMetadata?.contentType ??
		(key.endsWith(".svg") ? "image/svg+xml" : key.endsWith(".png") ? "image/png" : "image/jpeg");

	return new Response(obj.body, {
		headers: {
			"Content-Type": contentType,
			"Cache-Control": "public, max-age=300, s-maxage=86400",
			ETag: `"${key}"`,
		},
	});
}
