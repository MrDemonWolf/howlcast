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
					gap: "20px",
					fontSize: "20px",
					fontFamily: "monospace",
					letterSpacing: "0.2em",
					textTransform: "uppercase",
					color: BRAND.cyan,
				}}
			>
				<svg
					width="56"
					height="56"
					viewBox="0 0 100 100"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M 18 64 A 32 32 0 0 1 82 64"
						stroke="#0FACED"
						strokeWidth="6"
						strokeLinecap="round"
						fill="none"
					/>
					<path
						d="M 30 64 A 20 20 0 0 1 70 64"
						stroke="#0FACED"
						strokeWidth="6"
						strokeLinecap="round"
						fill="none"
					/>
					<path
						d="M 42 64 A 8 8 0 0 1 58 64"
						stroke="#0FACED"
						strokeWidth="6"
						strokeLinecap="round"
						fill="none"
					/>
					<path d="M 42 64 L 50 80 L 58 64 Z" fill="#0FACED" />
				</svg>
				<span>LIVE STREAMING · INVITE ONLY</span>
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
