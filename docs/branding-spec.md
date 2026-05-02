# Branding & White-label Spec

> **Note:** The `Branding.html` design file from the second Claude Design session was unavailable when we tried to fetch it (link expired). This spec captures the locked decisions from your design conversation and turns them into a buildable spec for Claude Code.
>
> If you re-export `Branding.html` later and there are visual surprises, we can iterate.

## What this covers

The dashboard's **Branding** page (under `Server` in the sidebar) where the broadcaster controls:

1. **Logo** — replaces the cyan H tile (`.brand-mark`) site-wide
2. **Platform name** — replaces "HowlCast" wordmark site-wide
3. **Footer attribution** — controls the "Powered by HowlCast" line
4. **Privacy Policy** — bare-min WYSIWYG
5. **Terms of Service** — bare-min WYSIWYG

## Where it lives

**Sidebar:** `Server → Branding` (new entry, sits above `Self-host status`)

```
SERVER
  ◯ Branding         ← NEW
  ◯ Self-host status
  ◯ Account
```

## The page layout

Single page, three sections stacked. Match the dashboard's existing `.card` pattern.

### Section 1 — Logo & platform name

```
┌─ Logo & platform name ──────────────────────────────────┐
│ Override what people see in the nav, emails, and OG.   │
│                                                          │
│ ┌─ Custom logo ─────────────────────────┐               │
│ │  [   logo preview 64x64   ]           │               │
│ │  Drop SVG/PNG or click to upload      │               │
│ │  [ Reset to default ]                 │               │
│ └───────────────────────────────────────┘               │
│                                                          │
│ ┌─ Platform name ───────────────────────┐               │
│ │  [ HowlCast___________________ ]      │               │
│ │  Shown in nav, emails, OG image       │               │
│ └───────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────┘
```

**Behavior:**

- Upload accepts: `.svg` (preferred), `.png` (≥256px), `.jpg`
- Stored in R2 at `branding/logo-{hash}.{ext}` so it's CDN-cached
- "Reset to default" puts back the cyan H tile (or whichever variant got picked from `assets/logo-variants.html`)
- Platform name is plain text, max 24 chars, defaults to "HowlCast"
- Live preview: nav at the top of the page updates in real time as you type/upload

### Section 2 — Footer attribution

```
┌─ Footer attribution ────────────────────────────────────┐
│ The "Powered by..." line that shows in the footer.      │
│                                                          │
│ ◉ Default                                                │
│   "Powered by HowlCast by MrDemonWolf, Inc."           │
│                                                          │
│ ○ Custom                                                 │
│   [ Powered by Acme Co.____________________ ]          │
│                                                          │
│ ○ Off · requires HowlCast Pro license                   │
│   No attribution shown. Available with paid license.   │
└──────────────────────────────────────────────────────────┘
```

**Behavior:**

- Three radio options
- "Off" is gated behind a license check (TBD whether HowlCast Pro is a thing for v1 — see `docs/decisions.md` #11). For now, "Off" is selectable but shows a soft notice.
- Custom field accepts plain text, max 80 chars
- Live preview at bottom of page shows footer rendering

### Section 3 — Privacy & Terms

```
┌─ Legal ─────────────────────────────────────────────────┐
│ Bare-min Privacy Policy and Terms. Auto-linked in footer.│
│                                                          │
│ [ Privacy Policy ] [ Terms of Service ]   ← tab switcher│
│                                                          │
│ ┌─ WYSIWYG editor ──────────────────────┐               │
│ │  B  I  H1  H2  •  link  ↺ ↻          │               │
│ │ ─────────────────────────────────────  │               │
│ │                                        │               │
│ │  [ rich text content ]                │               │
│ │                                        │               │
│ │                                        │               │
│ └───────────────────────────────────────┘               │
│                                                          │
│ Last edited: 2 days ago                                 │
│ Visible at: /privacy                                    │
│                                                          │
│ [ Discard ]              [ Save & publish ]             │
└──────────────────────────────────────────────────────────┘
```

**Behavior:**

- Tab switcher between Privacy and Terms (same editor, different content)
- Editor toolbar: bold, italic, H1, H2, bullet list, ordered list, link, undo/redo
- Library: **Tiptap** (already shadcn-friendly, lightweight, works in Workers via SSR)
- Output stored as sanitized HTML in `legalDocs.bodyHtml` (D1)
- Sanitization on save: DOMPurify or `rehype-sanitize`
- Renders at `/privacy` and `/terms` (public routes, no auth required)
- Both routes auto-linked in the global footer

**Default content seeded on first run:**

The seed templates should be generic enough to be legally functional but obviously placeholder. Ship with a "you should review and customize this" notice at the top of each document.

## Where the branding shows up site-wide

When the broadcaster customizes any of these, here's what changes:

| Setting               | Affects                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| Custom logo           | Channel page nav · Dashboard nav · Email template header · Favicon · OG images · Apple touch icons |
| Custom platform name  | Same places as logo (the wordmark text) · `<title>` tag prefix · Email subject prefix              |
| Footer attribution    | Footer of every page (channel, dashboard, account, /privacy, /terms)                               |
| Privacy/Terms content | `/privacy` and `/terms` routes · Footer links                                                      |

## Schema (already in `architecture.md`)

```ts
// White-label settings — single row, id='site'
export const whiteLabel = sqliteTable("white_label", {
	id: text("id").primaryKey().default("site"),
	customLogoKey: text("custom_logo_key"), // R2 key, null = use default
	customPlatformName: text("custom_platform_name"), // null = "HowlCast"
	footerAttribution: text("footer_attribution", { enum: ["default", "custom", "off"] })
		.notNull()
		.default("default"),
	customFooterText: text("custom_footer_text"), // used when footerAttribution = "custom"
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// Privacy + Terms — two rows, ids = 'privacy' | 'terms'
export const legalDocs = sqliteTable("legal_docs", {
	id: text("id").primaryKey(), // 'privacy' | 'terms'
	bodyHtml: text("body_html").notNull(), // sanitized rich text from WYSIWYG
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
```

## Implementation notes

### Logo upload flow

1. User drops file → client-side validation (file type, size < 1MB)
2. POST to `/api/upload/logo` → server validates, generates content hash, uploads to R2 at `branding/logo-{hash}.{ext}`
3. Update `whiteLabel.customLogoKey` to the new R2 key
4. Old logo is **kept** in R2 (don't delete) so cached references don't 404 — manual cleanup task in Phase 6 ops runbook

### Platform name fallback chain

```ts
const platformName = whiteLabel.customPlatformName ?? "HowlCast";
```

Used everywhere via a `usePlatformName()` hook (or just read from a layout-level prop).

### Footer rendering

```tsx
function Footer() {
	const wl = useWhiteLabel();
	return (
		<footer>
			<div className="legal-links">
				<Link href="/privacy">Privacy</Link>
				<Link href="/terms">Terms</Link>
			</div>
			<div className="attribution">
				{wl.footerAttribution === "default" && (
					<span>Powered by HowlCast by MrDemonWolf, Inc.</span>
				)}
				{wl.footerAttribution === "custom" && <span>{wl.customFooterText}</span>}
				{wl.footerAttribution === "off" && null}
			</div>
		</footer>
	);
}
```

### Tiptap setup (Phase 5)

```tsx
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

function LegalEditor({ doc, onSave }) {
	const editor = useEditor({
		extensions: [
			StarterKit, // bold, italic, headings, lists, undo/redo
			Link.configure({ openOnClick: false }),
		],
		content: doc.bodyHtml,
	});

	// Save handler sanitizes via rehype-sanitize before persisting
}
```

### Sanitization (CRITICAL)

Never trust the raw HTML coming out of the editor. On save:

```ts
import { sanitize } from 'rehype-sanitize';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';

const cleanHtml = await unified()
  .use(rehypeParse, { fragment: true })
  .use(sanitize, {
    tagNames: ['p', 'h1', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br'],
    attributes: { a: ['href', 'title'] },
    protocols: { href: ['http', 'https', 'mailto'] },
  })
  .use(rehypeStringify)
  .process(rawHtml);

await db.update(legalDocs).set({ bodyHtml: cleanHtml.toString() }).where(...);
```

This prevents script injection, weird inline styles, image embeds, etc.

## Open questions for this spec

- **#11 (decisions.md):** Should "Footer attribution: Off" require a paid HowlCast Pro license? Or always free?
  - **My recommendation:** keep it free for v1. License gating is product-strategy work that's bigger than this spec. Mark "Off" as available now, license-gate later if you want.
- **#12 (decisions.md):** Tiptap WYSIWYG vs full markdown?
  - **My recommendation:** Tiptap (locked here unless you object). Lighter, friendlier on mobile, no markdown learning curve for non-technical edits.

## When this gets built

This is **Phase 5 (Dashboard) work**, items 5.16 + 5.17 in the build plan. The schema is already defined. The page just needs to be built when we get to that phase.

## Default seeded content (drop into legalDocs on first run)

Both should start with a banner-style notice at the top:

```html
<div
	style="border:1px solid #f5a623; background:#fffbf0; padding:12px; border-radius:8px; margin-bottom:16px; font-size:13px;"
>
	<strong>⚠ Placeholder text.</strong> This was auto-generated. Review and customize before going
	live with real users. Consider talking to a lawyer if you're not sure.
</div>
```

Then a basic structure for each:

**Privacy Policy seed:**

- Who collects the data (you, the broadcaster)
- What data is collected (email, display name, IP for fraud prevention, chat messages)
- Why (auth, chat moderation, transactional emails)
- Third parties (GetStream for chat/video, Cloudflare for hosting, Resend for email)
- Cookies (auth session only, no analytics by default)
- Right to deletion (account → danger zone → delete)
- How to contact you (email)
- Last updated (auto-stamped)

**Terms of Service seed:**

- This is a private community streaming platform
- You must be 13+ (or whatever the local age requirement is)
- Don't post anything illegal, harassing, or in violation of the broadcaster's den rules
- The broadcaster reserves the right to revoke invites, ban accounts
- Content posted in chat may be moderated, edited, or removed
- No warranty (it's a hobby project)
- Governing law (broadcaster's jurisdiction — Wisconsin for MrDemonWolf, Inc.)
- Last updated (auto-stamped)

The seed text is intentionally **generic** so it works for HowlCast self-hosters everywhere, with the warning banner pushing them to customize.
