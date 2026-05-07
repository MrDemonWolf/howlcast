// Streamer Mode store tests. The store backs a sensitive UI affordance —
// a regression here would show the broadcaster's stream key during a
// screen share. Worth pinning down.

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { maskWithPrefix, setStreamerMode } from "./streamer-mode";

describe("setStreamerMode", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});
	afterEach(() => {
		setStreamerMode(false);
		window.localStorage.clear();
	});

	it("persists true to localStorage as '1'", () => {
		setStreamerMode(true);
		expect(window.localStorage.getItem("howlcast:streamer-mode")).toBe("1");
	});

	it("persists false to localStorage as '0'", () => {
		setStreamerMode(true);
		setStreamerMode(false);
		expect(window.localStorage.getItem("howlcast:streamer-mode")).toBe("0");
	});

	it("survives a localStorage write failure (in-memory only)", () => {
		const orig = Storage.prototype.setItem;
		Storage.prototype.setItem = () => {
			throw new Error("quota");
		};
		expect(() => setStreamerMode(true)).not.toThrow();
		Storage.prototype.setItem = orig;
	});
});

describe("maskWithPrefix", () => {
	it("returns the input unchanged when shorter than the prefix", () => {
		expect(maskWithPrefix("short", 32)).toBe("••••••••");
	});

	it("masks the tail and keeps a fixed prefix", () => {
		const url = "https://discord.com/api/webhooks/1234567890/abc-secret-token-here";
		const out = maskWithPrefix(url, 32);
		expect(out).toMatch(/^https:\/\/discord\.com\/api\/webhooks/);
		expect(out).not.toContain("abc-secret-token-here");
		expect(out.endsWith("•••")).toBe(true);
	});

	it("returns input as-is when value is empty", () => {
		expect(maskWithPrefix("", 32)).toBe("");
	});
});
