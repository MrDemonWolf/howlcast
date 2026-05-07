// GetStream integration — Workers-compatible (WebCrypto only, no @stream-io/node-sdk).
// Pattern verified in docs/integrations/getstream.md. The same JWT works for both
// Video and Chat clients — sign once, init both.

const STREAM_VIDEO_API = "https://video.stream-io-api.com/api/v2";

export class StreamNotConfiguredError extends Error {
	constructor() {
		super("Stream not configured. Set STREAM_API_KEY and STREAM_API_SECRET to enable.");
		this.name = "StreamNotConfiguredError";
	}
}

function assertConfigured(apiKey: string, apiSecret: string) {
	if (!apiKey || !apiSecret) throw new StreamNotConfiguredError();
}

const enc = new TextEncoder();

function b64url(input: object | Uint8Array): string {
	const bytes = input instanceof Uint8Array ? input : enc.encode(JSON.stringify(input));
	let bin = "";
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
	return btoa(bin).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey(
		"raw",
		enc.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export type StreamUserClaims = {
	user_id: string;
	call_cids?: string[];
	role?: string;
};

// Sign a per-user JWT. The broadcaster's token doubles as their OBS stream key.
export async function signStreamUserToken(
	apiSecret: string,
	payload: StreamUserClaims,
	ttlSec = 3600,
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const body = { iat: now, exp: now + ttlSec, ...payload };
	const head = b64url({ alg: "HS256", typ: "JWT" });
	const data = b64url(body);
	const sig = await hmacSha256(apiSecret, `${head}.${data}`);
	return `${head}.${data}.${b64url(sig)}`;
}

// Server-only token for REST calls. Empty user_id flags it as admin.
export function signAdminToken(apiSecret: string, ttlSec = 3600) {
	return signStreamUserToken(apiSecret, { user_id: "", role: "admin" } as StreamUserClaims, ttlSec);
}

type RestInit = Omit<RequestInit, "headers"> & {
	headers?: Record<string, string>;
};

async function streamRest(
	apiKey: string,
	apiSecret: string,
	path: string,
	init: RestInit = {},
): Promise<Response> {
	assertConfigured(apiKey, apiSecret);
	const adminToken = await signAdminToken(apiSecret);
	const url = `${STREAM_VIDEO_API}${path}${path.includes("?") ? "&" : "?"}api_key=${apiKey}`;
	return fetch(url, {
		...init,
		headers: {
			Authorization: adminToken,
			"stream-auth-type": "jwt",
			"Content-Type": "application/json",
			...(init.headers ?? {}),
		},
	});
}

// GetStream livestream call response shape — narrow on what we actually use.
// `ingress.rtmp.address` is the canonical RTMPS server URL for OBS; format
// varies by tier/region (e.g. `rtmps://...:443/livestream.{callId}`), so we
// always read it from the API rather than guessing.
export type StreamCallResponse = {
	call?: {
		id?: string;
		ingress?: {
			rtmp?: {
				address?: string;
			};
		};
	};
};

// Create the broadcaster's livestream call. Idempotent on GetStream side —
// safe to call again to refresh metadata. Returns the parsed call payload
// (includes ingress.rtmp.address, the OBS server URL).
export async function createCall(
	apiKey: string,
	apiSecret: string,
	callId: string,
	broadcasterId: string,
): Promise<StreamCallResponse> {
	const res = await streamRest(apiKey, apiSecret, `/video/call/livestream/${callId}`, {
		method: "POST",
		body: JSON.stringify({
			data: {
				created_by_id: broadcasterId,
				members: [{ user_id: broadcasterId, role: "host" }],
				custom: { channelCid: `livestream:${callId}` },
			},
		}),
	});
	if (!res.ok) throw new Error(`createCall failed: ${res.status} ${await res.text()}`);
	return (await res.json()) as StreamCallResponse;
}

// GET the existing call — used as a fallback to backfill ingress.rtmp.address
// when an old provision didn't capture it. Idempotent and cheap.
export async function getCall(
	apiKey: string,
	apiSecret: string,
	callId: string,
): Promise<StreamCallResponse | null> {
	const res = await streamRest(apiKey, apiSecret, `/video/call/livestream/${callId}`, {
		method: "GET",
	});
	if (!res.ok) return null;
	return (await res.json()) as StreamCallResponse;
}

export async function goLive(apiKey: string, apiSecret: string, callId: string) {
	const res = await streamRest(apiKey, apiSecret, `/video/call/livestream/${callId}/go_live`, {
		method: "POST",
		body: JSON.stringify({ start_hls: true }),
	});
	if (!res.ok) throw new Error(`goLive failed: ${res.status} ${await res.text()}`);
	return res.json();
}

export async function stopLive(apiKey: string, apiSecret: string, callId: string) {
	const res = await streamRest(apiKey, apiSecret, `/video/call/livestream/${callId}/stop_live`, {
		method: "POST",
	});
	if (!res.ok) throw new Error(`stopLive failed: ${res.status} ${await res.text()}`);
	return res.json();
}

// Constant-time HMAC-hex compare to verify GetStream webhook signatures.
// Called from apps/server with raw body + x-signature header.
export async function verifyStreamWebhook(
	rawBody: string,
	sigHeader: string,
	webhookSecret: string,
): Promise<boolean> {
	if (!webhookSecret || !sigHeader) return false;
	const sig = await hmacSha256(webhookSecret, rawBody);
	let hex = "";
	for (let i = 0; i < sig.length; i++) hex += sig[i]!.toString(16).padStart(2, "0");
	if (hex.length !== sigHeader.length) return false;
	let r = 0;
	for (let i = 0; i < hex.length; i++) {
		r |= hex.charCodeAt(i) ^ sigHeader.charCodeAt(i);
	}
	return r === 0;
}
