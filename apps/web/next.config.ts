import "@howlcast/env/web";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	async rewrites() {
		const target = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000";
		return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
	},
	images: {
		// Defense-in-depth allowlist. Local logos at /branding/logo are
		// same-origin and don't need a remotePatterns entry. Anything
		// remote MUST come through our own *.howlcast.tv hosts.
		remotePatterns: [
			{ protocol: "https", hostname: "*.howlcast.tv" },
			{ protocol: "https", hostname: "howlcast.tv" },
		],
		// Broadcaster-uploaded logos can be SVG. Upload route validates the
		// image/svg+xml Content-Type and only the broadcaster can upload, so
		// the source is trusted. CSP neutralizes any inline-script payload
		// that slips through validation.
		dangerouslyAllowSVG: true,
		contentDispositionType: "attachment",
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	},
};

export default nextConfig;

initOpenNextCloudflareForDev();
