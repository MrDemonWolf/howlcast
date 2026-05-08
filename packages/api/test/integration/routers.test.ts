// tRPC integration tests — focus on security boundaries, not coverage.
// Asserts that:
//   - broadcaster-only mutations actually enforce the role
//   - account.deleteMe blocks broadcaster (orphan-channel guard)
//   - branding.updateLegal sanitizes XSS at write time
//   - stream.getViewerToken emits the correct role per session
//
// Read paths are exercised by the deploy.yml smoke tests against prod.

import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTestDb, seedSiteConfig, seedUser, type TestDb } from "../helpers/setup-db";

// Module-level mocks. Hoisted by vitest before any imports below resolve.
let testDb: TestDb;

vi.mock("@howlcast/db", () => ({
	createDb: () => testDb,
}));

vi.mock("@howlcast/env/server", () => ({
	env: {
		STREAM_API_KEY: "test-key",
		STREAM_API_SECRET: "test-secret",
		BETTER_AUTH_URL: "https://api.howlcast.tv",
		BETTER_AUTH_SECRET: "test",
		CORS_ORIGIN: "https://howlcast.tv",
		DB: null,
	},
}));

// Import AFTER mocks are registered.
const { brandingRouter } = await import("../../src/routers/branding");
const { accountRouter } = await import("../../src/routers/account");
const { streamRouter } = await import("../../src/routers/stream");

const BROADCASTER_ID = "broadcaster-1";
const VIEWER_ID = "viewer-1";

// Use `any` for the synthetic ctx — the real Context type pulls in
// better-auth's full session shape (Date fields, ipAddress, userAgent),
// none of which the routers under test actually read. The runtime cast
// is fine; the routers only touch session.user.id and session.session.id.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ctx(userId: string | null): any {
	if (!userId) {
		return { session: null, db: testDb, headers: new Headers(), hono: {} };
	}
	const now = new Date();
	return {
		session: {
			user: { id: userId },
			session: {
				id: `s-${userId}`,
				token: `t-${userId}`,
				userId,
				createdAt: now,
				updatedAt: now,
				expiresAt: new Date(now.getTime() + 86400000),
			},
		},
		db: testDb,
		headers: new Headers(),
		hono: {},
	};
}

beforeEach(async () => {
	testDb = await createTestDb();
	await seedUser(testDb, BROADCASTER_ID, "broadcaster@example.com", "broadcaster");
	await seedUser(testDb, VIEWER_ID, "viewer@example.com", "viewer");
	await seedSiteConfig(testDb, BROADCASTER_ID);
});

describe("brandingRouter", () => {
	it("get returns defaults for fresh install", async () => {
		const caller = brandingRouter.createCaller(ctx(null));
		const out = await caller.get();
		expect(out.platformName).toBe("HowlCast");
		expect(out.footerAttribution).toBe("default");
		expect(out.customLogoKey).toBeNull();
	});

	it("update by broadcaster persists and reads back", async () => {
		const caller = brandingRouter.createCaller(ctx(BROADCASTER_ID));
		await caller.update({ customPlatformName: "Acme Stream", footerAttribution: "off" });
		const out = await caller.get();
		expect(out.platformName).toBe("Acme Stream");
		expect(out.footerAttribution).toBe("off");
	});

	it("update by viewer is rejected with FORBIDDEN", async () => {
		const caller = brandingRouter.createCaller(ctx(VIEWER_ID));
		await expect(caller.update({ customPlatformName: "Hijack" })).rejects.toThrow(TRPCError);
	});

	it("updateLegal sanitizes script tags before persisting", async () => {
		const caller = brandingRouter.createCaller(ctx(BROADCASTER_ID));
		await caller.updateLegal({
			id: "privacy",
			bodyHtml: '<p>safe</p><script>alert("xss")</script>',
		});
		const doc = await caller.getLegal({ id: "privacy" });
		expect(doc.bodyHtml).toContain("<p>safe</p>");
		expect(doc.bodyHtml.toLowerCase()).not.toContain("<script");
	});

	it("updateLegal by viewer is rejected", async () => {
		const caller = brandingRouter.createCaller(ctx(VIEWER_ID));
		await expect(caller.updateLegal({ id: "privacy", bodyHtml: "<p>nope</p>" })).rejects.toThrow(
			TRPCError,
		);
	});
});

describe("accountRouter", () => {
	it("updateProfile updates the calling user's row only", async () => {
		const caller = accountRouter.createCaller(ctx(VIEWER_ID));
		await caller.updateProfile({ displayName: "New Name" });
		const me = await caller.me();
		expect(me.profile?.displayName).toBe("New Name");

		// Broadcaster's row untouched
		const bcaster = accountRouter.createCaller(ctx(BROADCASTER_ID));
		const bme = await bcaster.me();
		expect(bme.profile?.displayName).not.toBe("New Name");
	});

	it("deleteMe succeeds for viewer", async () => {
		const caller = accountRouter.createCaller(ctx(VIEWER_ID));
		await expect(caller.deleteMe()).resolves.toEqual({ ok: true });
	});

	it("deleteMe blocks broadcaster (would orphan channel)", async () => {
		const caller = accountRouter.createCaller(ctx(BROADCASTER_ID));
		await expect(caller.deleteMe()).rejects.toThrow(TRPCError);
	});
});

describe("streamRouter.getViewerToken role logic", () => {
	function decodePayload(jwt: string) {
		const [, payload] = jwt.split(".");
		const std = payload!.replace(/-/g, "+").replace(/_/g, "/");
		const pad = "=".repeat((4 - (std.length % 4)) % 4);
		return JSON.parse(atob(std + pad));
	}

	it("anonymous viewer gets role 'anonymous'", async () => {
		const caller = streamRouter.createCaller(ctx(null));
		const out = await caller.getViewerToken();
		expect(out.isGuest).toBe(true);
		expect(decodePayload(out.token).role).toBe("anonymous");
	});

	it("signed-in viewer gets role 'user'", async () => {
		const caller = streamRouter.createCaller(ctx(VIEWER_ID));
		const out = await caller.getViewerToken();
		expect(out.isGuest).toBe(false);
		expect(decodePayload(out.token).role).toBe("user");
	});

	it("broadcaster on the channel page gets role 'broadcaster'", async () => {
		const caller = streamRouter.createCaller(ctx(BROADCASTER_ID));
		const out = await caller.getViewerToken();
		expect(out.isGuest).toBe(false);
		expect(decodePayload(out.token).role).toBe("broadcaster");
	});
});
