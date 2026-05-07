import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ?? "https://howlcast.tv";

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();
	return [
		{ url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
		{ url: `${SITE}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
		{ url: `${SITE}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
		{ url: `${SITE}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
	];
}
