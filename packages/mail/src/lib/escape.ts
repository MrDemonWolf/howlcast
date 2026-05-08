// Mail-package copy of HTML escape so @howlcast/mail stays free of @howlcast/api
// circular deps. Keep in sync with packages/api/src/lib/html.ts — the rule set
// covers OWASP minimum for HTML body + attribute contexts.

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
