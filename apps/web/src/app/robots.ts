import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ?? "https://howlcast.tv";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: ["/", "/privacy", "/terms", "/login"],
				disallow: ["/dashboard", "/account", "/setup", "/invite", "/popout", "/api"],
			},
		],
		sitemap: `${SITE}/sitemap.xml`,
	};
}
