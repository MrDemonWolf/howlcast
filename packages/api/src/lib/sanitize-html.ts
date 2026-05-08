// Sanitize HTML coming from the Tiptap WYSIWYG editor before persisting it
// to legalDocs.bodyHtml. Read-side renders raw HTML via dangerouslySetInnerHTML,
// so anything stripped here would otherwise execute in the viewer's browser.
//
// Allowed surface is intentionally narrow: paragraphs, headings, basic
// formatting, lists, and links. No images, no inline styles, no scripts.

import type { Element, Root } from "hast";
import rehypeParse from "rehype-parse";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const schema = {
	...defaultSchema,
	tagNames: ["p", "h1", "h2", "h3", "h4", "strong", "em", "ul", "ol", "li", "a", "br", "div"],
	attributes: {
		a: ["href", "title", "target", "rel"],
		div: ["className"],
	},
	protocols: {
		href: ["http", "https", "mailto"],
	},
};

// Force `rel="noopener noreferrer"` on every <a target="_blank">. Tab-nabbing
// + referrer-leak protection — sanitize-html can't enforce this directly so
// we run a second pass.
function rehypeForceRel() {
	return (tree: Root) => {
		visit(tree, "element", (node: Element) => {
			if (node.tagName !== "a") return;
			const target = node.properties?.target;
			if (target !== "_blank") return;
			node.properties = node.properties ?? {};
			node.properties.rel = "noopener noreferrer";
		});
	};
}

export async function sanitizeLegalHtml(rawHtml: string): Promise<string> {
	const file = await unified()
		.use(rehypeParse, { fragment: true })
		.use(rehypeSanitize, schema)
		.use(rehypeForceRel)
		.use(rehypeStringify)
		.process(rawHtml);
	return String(file);
}
