import Link from "next/link";

import { PageContainer } from "@/components/layout";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000";

type LegalId = "privacy" | "terms";
type LegalDoc = { id: LegalId; bodyHtml: string; updatedAt: number };

async function fetchLegal(id: LegalId): Promise<LegalDoc | null> {
	try {
		const res = await fetch(
			`${SERVER_URL}/api/trpc/branding.getLegal?input=${encodeURIComponent(JSON.stringify({ id }))}`,
			{
				headers: { accept: "application/json" },
				next: { revalidate: 60 },
			},
		);
		if (!res.ok) return null;
		const json = (await res.json()) as { result?: { data?: LegalDoc } };
		return json.result?.data ?? null;
	} catch {
		return null;
	}
}

const META: Record<
	LegalId,
	{ title: string; emptyText: string; sibling: LegalId; siblingLabel: string }
> = {
	privacy: {
		title: "Privacy Policy",
		emptyText: "Privacy policy is not yet available.",
		sibling: "terms",
		siblingLabel: "Terms of Service →",
	},
	terms: {
		title: "Terms of Service",
		emptyText: "Terms are not yet available.",
		sibling: "privacy",
		siblingLabel: "Privacy Policy →",
	},
};

export async function LegalDocPage({ id }: { id: LegalId }) {
	const doc = await fetchLegal(id);
	const lastUpdated = doc?.updatedAt ? new Date(doc.updatedAt).toISOString().slice(0, 10) : null;
	const meta = META[id];

	return (
		<PageContainer variant="prose" className="py-10">
			<header className="mb-8 border-border border-b pb-6">
				<span className="font-mono text-[10px] text-cyan uppercase tracking-[0.2em]">Legal</span>
				<h1 className="mt-2 font-display font-semibold text-4xl text-foreground tracking-tight">
					{meta.title}
				</h1>
				{lastUpdated ? (
					<p className="mt-2 font-mono text-fg-3 text-xs uppercase tracking-wider">
						Last updated {lastUpdated}
					</p>
				) : null}
			</header>

			{doc ? (
				<article
					className="howlcast-prose flex flex-col gap-4 text-fg-2 text-sm leading-relaxed"
					// Sanitization happens server-side at write time via rehype-sanitize.
					// Rendering as HTML is safe — anything dangerous would have been
					// stripped before reaching the DB. See packages/api/src/lib/sanitize-html.ts.
					dangerouslySetInnerHTML={{ __html: doc.bodyHtml }}
				/>
			) : (
				<p className="text-muted-foreground text-sm">{meta.emptyText}</p>
			)}

			<footer className="mt-10 flex justify-between border-border border-t pt-6 text-fg-3 text-xs">
				<Link href="/" className="hover:text-foreground">
					← Back to channel
				</Link>
				<Link href={`/${meta.sibling}` as never} className="hover:text-foreground">
					{meta.siblingLabel}
				</Link>
			</footer>
		</PageContainer>
	);
}
