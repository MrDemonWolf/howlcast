import "@howlcast/env/web";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	async rewrites() {
		const target =
			process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000";
		return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
	},
};

export default nextConfig;

initOpenNextCloudflareForDev();
