// Tiny KV-backed counter for rate-limiting hot procedures (logo upload,
// createInvite, setup.commit, refreshEmotes). Not a precise sliding window —
// good enough to block burst abuse from a single actor or IP.
//
// Each key tracks { count, windowStart }. `enforce` increments and returns
// true when the caller is over the limit; the caller throws TOO_MANY_REQUESTS.

import { TRPCError } from "@trpc/server";

type Bucket = { count: number; windowStart: number };

export type ThrottleOptions = {
	kv: KVNamespace;
	key: string;
	limit: number;
	windowSec: number;
};

export async function enforceThrottle(opts: ThrottleOptions): Promise<void> {
	const now = Date.now();
	const cur = await opts.kv.get<Bucket>(opts.key, "json");
	const windowMs = opts.windowSec * 1000;
	const expired = !cur || now - cur.windowStart > windowMs;
	const next: Bucket = expired
		? { count: 1, windowStart: now }
		: { count: cur.count + 1, windowStart: cur.windowStart };

	if (next.count > opts.limit) {
		throw new TRPCError({
			code: "TOO_MANY_REQUESTS",
			message: "Rate limit exceeded. Try again shortly.",
		});
	}

	// TTL slightly past window so the key auto-expires once it's pointless.
	await opts.kv.put(opts.key, JSON.stringify(next), {
		expirationTtl: Math.max(60, opts.windowSec + 30),
	});
}
