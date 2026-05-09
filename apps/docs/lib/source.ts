import { type InferPageType, loader } from "fumadocs-core/source";
import { docs } from "@/.source/server.ts";

// fumadocs-mdx@11.5+ returns files as a lazy function,
// but fumadocs-core@15.x expects an array — resolve it here.
const raw = docs.toFumadocsSource();
const files =
	typeof raw.files === "function" ? (raw.files as unknown as () => typeof raw.files)() : raw.files;

export const source = loader({
	baseUrl: "/docs",
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	source: { ...raw, files } as any,
});

// Per-page OG image URL helper. Used by both generateMetadata
// (so each doc page links its own OG image) and generateStaticParams
// in the OG route (so each path gets pre-rendered).
export function getPageImage(page: InferPageType<typeof source>) {
	const segments = [...page.slugs, "image.png"];
	return {
		segments,
		url: `/og/docs/${segments.join("/")}`,
	};
}
