// HTML-escape user-supplied strings before they land in email/subject bodies.
// The five characters cover the OWASP minimum for HTML body + attribute
// contexts. Use `escapeHtml` for text nodes and visible content; use
// `escapeHtmlAttr` when the value sits inside a quoted attribute.

const HTML_MAP: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

export function escapeHtml(input: string | null | undefined): string {
	if (!input) return "";
	return input.replace(/[&<>"']/g, (c) => HTML_MAP[c] ?? c);
}

export const escapeHtmlAttr = escapeHtml;
