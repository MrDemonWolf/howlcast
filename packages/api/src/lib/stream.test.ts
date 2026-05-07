// JWT signing + webhook verification tests. These are the security
// boundary between OBS / GetStream and our worker — wrong logic here means
// anyone could fake a webhook or impersonate a user.

import { describe, expect, it } from "vitest";

import { signStreamUserToken, verifyStreamWebhook } from "./stream";

const SECRET = "test-secret-please-do-not-leak";

function decodeBase64Url(s: string): string {
	// JWT base64url -> standard base64 -> string
	const pad = "=".repeat((4 - (s.length % 4)) % 4);
	const std = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
	return atob(std);
}

describe("signStreamUserToken", () => {
	it("produces a 3-segment JWT", async () => {
		const tok = await signStreamUserToken(SECRET, { user_id: "alice" });
		const parts = tok.split(".");
		expect(parts).toHaveLength(3);
	});

	it("encodes the user_id and role into the payload", async () => {
		const tok = await signStreamUserToken(SECRET, {
			user_id: "alice",
			role: "broadcaster",
		});
		const payload = JSON.parse(decodeBase64Url(tok.split(".")[1]!));
		expect(payload.user_id).toBe("alice");
		expect(payload.role).toBe("broadcaster");
	});

	it("emits HS256 alg in the header", async () => {
		const tok = await signStreamUserToken(SECRET, { user_id: "alice" });
		const header = JSON.parse(decodeBase64Url(tok.split(".")[0]!));
		expect(header.alg).toBe("HS256");
		expect(header.typ).toBe("JWT");
	});

	it("sets iat and exp claims with the expected ttl", async () => {
		const before = Math.floor(Date.now() / 1000);
		const tok = await signStreamUserToken(SECRET, { user_id: "alice" }, 600);
		const payload = JSON.parse(decodeBase64Url(tok.split(".")[1]!));
		expect(payload.iat).toBeGreaterThanOrEqual(before);
		expect(payload.exp - payload.iat).toBe(600);
	});

	it("produces different sigs for different secrets", async () => {
		const a = await signStreamUserToken("secret-a", { user_id: "alice" });
		const b = await signStreamUserToken("secret-b", { user_id: "alice" });
		expect(a.split(".")[2]).not.toBe(b.split(".")[2]);
	});
});

describe("verifyStreamWebhook", () => {
	const enc = new TextEncoder();

	async function hmacHex(secret: string, body: string): Promise<string> {
		const key = await crypto.subtle.importKey(
			"raw",
			enc.encode(secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);
		const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(body)));
		return Array.from(sig)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}

	it("accepts a correctly-signed body", async () => {
		const body = '{"type":"call.live_started"}';
		const sig = await hmacHex(SECRET, body);
		expect(await verifyStreamWebhook(body, sig, SECRET)).toBe(true);
	});

	it("rejects when the signature is wrong", async () => {
		const body = '{"type":"call.live_started"}';
		const sig = await hmacHex(SECRET, body);
		const tampered = sig.slice(0, -2) + (sig.endsWith("00") ? "ff" : "00");
		expect(await verifyStreamWebhook(body, tampered, SECRET)).toBe(false);
	});

	it("rejects when the body has been modified", async () => {
		const body = '{"type":"call.live_started"}';
		const sig = await hmacHex(SECRET, body);
		const tampered = '{"type":"call.session_ended"}';
		expect(await verifyStreamWebhook(tampered, sig, SECRET)).toBe(false);
	});

	it("rejects when the secret differs", async () => {
		const body = '{"x":1}';
		const sig = await hmacHex("other-secret", body);
		expect(await verifyStreamWebhook(body, sig, SECRET)).toBe(false);
	});

	it("rejects on length mismatch (prevents prefix-only validation)", async () => {
		const body = '{"x":1}';
		const sig = await hmacHex(SECRET, body);
		expect(await verifyStreamWebhook(body, sig.slice(0, 10), SECRET)).toBe(false);
	});
});
