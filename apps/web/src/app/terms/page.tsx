import Link from "next/link";

export const metadata = {
	title: "Terms · HowlCast",
	description: "Acceptable use, content ownership, and dispute terms for HowlCast.",
};

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000";

type LegalDoc = { id: "privacy" | "terms"; bodyHtml: string; updatedAt: number };

async function fetchLegal(id: "privacy" | "terms"): Promise<LegalDoc | null> {
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

export default async function TermsPage() {
	const doc = await fetchLegal("terms");
	const lastUpdated = doc?.updatedAt ? new Date(doc.updatedAt).toISOString().slice(0, 10) : null;

	return (
		<main className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
			<header className="mb-8 border-border border-b pb-6">
				<span className="font-mono text-[10px] text-cyan uppercase tracking-[0.2em]">Legal</span>
				<h1 className="mt-2 font-display font-semibold text-4xl text-foreground tracking-tight">
					Terms of Service
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
					dangerouslySetInnerHTML={{ __html: doc.bodyHtml }}
				/>
			) : (
				<p className="text-muted-foreground text-sm">Terms are not yet available.</p>
			)}

			<footer className="mt-10 flex justify-between border-border border-t pt-6 text-fg-3 text-xs">
				<Link href="/" className="hover:text-foreground">
					← Back to channel
				</Link>
				<Link href={"/privacy" as never} className="hover:text-foreground">
					Privacy Policy →
				</Link>
			</footer>
		</main>
	);
}
