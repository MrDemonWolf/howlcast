import { generateOGImage } from "fumadocs-ui/og";
import { notFound } from "next/navigation";
import { getPageImage, source } from "@/lib/source.ts";

export const dynamic = "force-static";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string[] }> }) {
	const { slug } = await ctx.params;
	const page = source.getPage(slug.slice(0, -1));
	if (!page) notFound();

	return generateOGImage({
		title: page.data.title,
		description: page.data.description,
		site: "HowlCast Docs",
		primaryColor: "#0FACED",
		primaryTextColor: "#091533",
	});
}

export function generateStaticParams() {
	return source.getPages().map((page) => ({
		slug: getPageImage(page).segments,
	}));
}
