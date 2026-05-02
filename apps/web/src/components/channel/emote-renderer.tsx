// Emote rendering pipeline for stream-chat-react. Hooks into the
// renderText prop on <MessageList> to swap word-level matches against
// the emote map for inline <img> tags pointing at provider CDNs.
//
// Browser caches the images directly (no R2 proxy per DESIGN-DECISIONS).

import { findAndReplace } from "hast-util-find-and-replace";
import type { Root } from "hast";
import { u } from "unist-builder";

export type EmoteRecord = {
	id: string;
	name: string;
	url1x: string;
	url2x: string;
};

// Word-level emote replacement. Matches whole-word tokens against the map;
// emotes commonly use mixed case (e.g. `FeelsGoodMan`), so the match is
// case-sensitive — that's the convention every provider uses.
export function emoteRehypePlugin(emoteMap: Map<string, EmoteRecord>) {
	return () => (tree: Root) => {
		findAndReplace(tree, [
			[
				/\b([A-Za-z0-9_:!]+)\b/g,
				(_match: string, word: string) => {
					const e = emoteMap.get(word);
					if (!e) return false;
					return u(
						"element",
						{
							tagName: "img",
							properties: {
								src: e.url1x,
								srcset: `${e.url1x} 1x, ${e.url2x} 2x`,
								alt: word,
								title: word,
								dataEmoteId: e.id,
								className: ["howlcast-emote"],
							},
						},
						[],
					);
				},
			],
		]);
	};
}
