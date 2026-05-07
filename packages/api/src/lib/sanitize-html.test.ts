// Sanitization tests. These are the security boundary between Tiptap
// editor output and what we render via dangerouslySetInnerHTML on the
// public legal pages — anything that lets through here ships to viewers.

import { describe, expect, it } from "vitest";

import { sanitizeLegalHtml } from "./sanitize-html";

describe("sanitizeLegalHtml", () => {
	it("preserves allowed formatting (bold, italic, links, lists)", async () => {
		const input = `<p>Hello <strong>world</strong> — <em>italic</em></p>
		<ul><li>one</li><li><a href="https://example.com">two</a></li></ul>
		<h2>Heading</h2>`;
		const out = await sanitizeLegalHtml(input);
		expect(out).toContain("<strong>world</strong>");
		expect(out).toContain("<em>italic</em>");
		expect(out).toContain('href="https://example.com"');
		expect(out).toContain("<h2>Heading</h2>");
		expect(out).toContain("<li>one</li>");
	});

	it("strips script tags", async () => {
		const input = '<p>safe</p><script>alert("xss")</script>';
		const out = await sanitizeLegalHtml(input);
		expect(out).toContain("<p>safe</p>");
		expect(out.toLowerCase()).not.toContain("<script");
		expect(out).not.toContain("alert");
	});

	it("strips javascript: hrefs", async () => {
		const input = '<a href="javascript:alert(1)">click</a>';
		const out = await sanitizeLegalHtml(input);
		expect(out).not.toContain("javascript:");
	});

	it("strips inline event handlers", async () => {
		const input = '<p onclick="evil()">hi</p>';
		const out = await sanitizeLegalHtml(input);
		expect(out).not.toContain("onclick");
		expect(out).toContain("hi");
	});

	it("strips iframes", async () => {
		const input = '<iframe src="https://evil.com"></iframe><p>after</p>';
		const out = await sanitizeLegalHtml(input);
		expect(out).not.toContain("<iframe");
		expect(out).toContain("after");
	});

	it("strips style tags + inline styles", async () => {
		const input = '<style>body{display:none}</style><p style="color:red">paragraph</p>';
		const out = await sanitizeLegalHtml(input);
		expect(out).not.toContain("<style");
		expect(out).not.toContain("color:red");
		expect(out).toContain("paragraph");
	});

	it("preserves mailto links", async () => {
		const input = '<a href="mailto:legal@mrdemonwolf.com">contact</a>';
		const out = await sanitizeLegalHtml(input);
		expect(out).toContain('href="mailto:legal@mrdemonwolf.com"');
	});

	it("strips data: protocol URLs (XSS vector via base64)", async () => {
		const input = '<a href="data:text/html,<script>alert(1)</script>">click</a>';
		const out = await sanitizeLegalHtml(input);
		expect(out).not.toContain("data:");
	});
});
