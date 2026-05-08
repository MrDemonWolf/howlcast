import { BRAND } from "@howlcast/config/brand";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HowlCast";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000";

type Branding = {
	platformName: string;
	customLogoKey: string | null;
};

async function fetchBranding(): Promise<Branding> {
	try {
		const res = await fetch(`${SERVER_URL}/api/trpc/branding.get`, {
			headers: { accept: "application/json" },
			next: { revalidate: 300 },
		});
		if (!res.ok) return { platformName: "HowlCast", customLogoKey: null };
		const json = (await res.json()) as {
			result?: { data?: Branding };
		};
		return json.result?.data ?? { platformName: "HowlCast", customLogoKey: null };
	} catch {
		return { platformName: "HowlCast", customLogoKey: null };
	}
}

export default async function ChannelOG() {
	const wl = await fetchBranding();
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: "72px",
				background: `linear-gradient(135deg, ${BRAND.ogGradStart} 0%, ${BRAND.ogGradMid} 60%, ${BRAND.ogGradEnd} 100%)`,
				color: BRAND.ogFg,
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "16px",
					fontSize: "20px",
					fontFamily: "monospace",
					letterSpacing: "0.2em",
					textTransform: "uppercase",
					color: BRAND.cyan,
				}}
			>
				LIVE STREAMING · INVITE ONLY
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
				<div style={{ fontSize: "104px", fontWeight: 700, lineHeight: 1 }}>{wl.platformName}</div>
				<div style={{ fontSize: "32px", color: BRAND.ogFgDim }}>For the inner circle.</div>
			</div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					fontSize: "20px",
					color: BRAND.ogFgFaint,
				}}
			>
				<span>{(SERVER_URL || "").replace(/^https?:\/\/(api\.)?/, "")}</span>
				<span style={{ color: BRAND.cyan }}>● LIVE NOW</span>
			</div>
		</div>,
		{ ...size },
	);
}
