import { BRAND } from "@howlcast/config/brand";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";

import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
	variable: "--font-bricolage",
	subsets: ["latin"],
});

const SITE_NAME = "HowlCast";
const SITE_DESCRIPTION = "For the inner circle.";
const SITE_URL = "https://howlcast.tv";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: SITE_NAME,
		template: "%s · HowlCast",
	},
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	keywords: ["livestream", "invite-only", "private stream", "self-hosted", "twitch alternative"],
	authors: [{ name: "MrDemonWolf, Inc." }],
	creator: "MrDemonWolf, Inc.",
	publisher: "MrDemonWolf, Inc.",
	icons: {
		icon: [{ url: "/logos/howlcast-favicon.svg", type: "image/svg+xml" }],
		shortcut: "/logos/howlcast-favicon.svg",
		apple: "/logos/howlcast-mark-on-cyan.svg",
	},
	openGraph: {
		type: "website",
		url: SITE_URL,
		siteName: SITE_NAME,
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
		images: [
			{
				url: "/logos/howlcast-mark-on-cyan.svg",
				width: 512,
				height: 512,
				alt: "HowlCast",
			},
		],
	},
	twitter: {
		card: "summary",
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
		images: ["/logos/howlcast-mark-on-cyan.svg"],
	},
	robots: {
		index: true,
		follow: true,
	},
	other: {
		"theme-color": BRAND.navy,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} bg-background text-foreground antialiased`}
			>
				<Providers>
					<div className="grid h-svh grid-rows-[auto_1fr]">
						<Header />
						{children}
					</div>
				</Providers>
			</body>
		</html>
	);
}
