// Emote rehype plugin tests. Verifies the word-level matcher produces
// img nodes for matches and leaves non-matching text alone.

import { describe, expect, it } from "vitest";

import { emoteRehypePlugin, type EmoteRecord } from "./emote-renderer";

// Build a minimal hast tree manually rather than wiring up
// remark→rehype: tests stay fast and the plugin only cares about the
// hast structure findAndReplace traverses.
function makeHast(text: string) {
	return {
		type: "root" as const,
		children: [
			{
				type: "element" as const,
				tagName: "p",
				properties: {},
				children: [{ type: "text" as const, value: text }],
			},
		],
	};
}

const FEELS_GOOD: EmoteRecord = {
	id: "1",
	name: "FeelsGoodMan",
	url1x: "https://cdn.example.com/fgm@1x.png",
	url2x: "https://cdn.example.com/fgm@2x.png",
};

describe("emoteRehypePlugin", () => {
	it("replaces matching word with an img element", () => {
		const tree = makeHast("hello FeelsGoodMan world");
		const map = new Map([[FEELS_GOOD.name, FEELS_GOOD]]);
		emoteRehypePlugin(map)()(tree);
		const p = tree.children[0]!;
		const img = p.children.find((c: any) => c.type === "element" && c.tagName === "img") as any;
		expect(img).toBeDefined();
		expect(img.properties.src).toBe(FEELS_GOOD.url1x);
		expect(img.properties.alt).toBe(FEELS_GOOD.name);
	});

	it("leaves non-matching text alone", () => {
		const tree = makeHast("nothing to see here");
		const map = new Map([[FEELS_GOOD.name, FEELS_GOOD]]);
		emoteRehypePlugin(map)()(tree);
		const p = tree.children[0]!;
		const hasImg = p.children.some((c: any) => c.type === "element" && c.tagName === "img");
		expect(hasImg).toBe(false);
	});

	it("is a no-op when the emote map is empty", () => {
		const tree = makeHast("FeelsGoodMan FeelsBadMan");
		const map = new Map<string, EmoteRecord>();
		emoteRehypePlugin(map)()(tree);
		const p = tree.children[0]!;
		const hasImg = p.children.some((c: any) => c.type === "element" && c.tagName === "img");
		expect(hasImg).toBe(false);
	});

	it("matches case-sensitively (provider convention)", () => {
		const tree = makeHast("feelsgoodman wins");
		const map = new Map([[FEELS_GOOD.name, FEELS_GOOD]]);
		emoteRehypePlugin(map)()(tree);
		const p = tree.children[0]!;
		const hasImg = p.children.some((c: any) => c.type === "element" && c.tagName === "img");
		expect(hasImg).toBe(false);
	});
});
