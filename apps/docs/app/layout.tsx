import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import "./global.css";

export const metadata = {
	title: {
		default: "HowlCast Docs",
		template: "%s | HowlCast Docs",
	},
	description:
		"Documentation for HowlCast — a self-hosted single-tenant invite-only live streaming platform built on Cloudflare Workers + GetStream.",
	openGraph: {
		title: "HowlCast Docs",
		description:
			"Documentation for HowlCast — a self-hosted single-tenant invite-only live streaming platform.",
		type: "website",
		siteName: "HowlCast",
	},
	twitter: {
		card: "summary_large_image",
		title: "HowlCast Docs",
		description:
			"Documentation for HowlCast — a self-hosted single-tenant invite-only live streaming platform.",
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning={true}>
			<body className="flex min-h-screen flex-col">
				<RootProvider
					search={{
						enabled: false,
					}}
					theme={{
						defaultTheme: "dark",
					}}
				>
					{children}
				</RootProvider>
			</body>
		</html>
	);
}
