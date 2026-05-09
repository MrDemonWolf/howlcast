import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "HowlCast — Run your own private den";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#091533";
const NAVY_DEEP = "#050b1f";
const CYAN = "#0FACED";
const FG = "#f1f5f9";
const FG_DIM = "rgba(241, 245, 249, 0.65)";
const FG_FAINT = "rgba(241, 245, 249, 0.4)";

export default function OG() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: "72px",
				background: `linear-gradient(135deg, ${NAVY_DEEP} 0%, ${NAVY} 60%, #0a1838 100%)`,
				color: FG,
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
					color: CYAN,
				}}
			>
				HOWLCAST · DOCS
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
				<div
					style={{
						fontSize: "104px",
						fontWeight: 700,
						lineHeight: 1,
						letterSpacing: "-0.03em",
					}}
				>
					Run your own
				</div>
				<div
					style={{
						fontSize: "104px",
						fontWeight: 700,
						lineHeight: 1,
						letterSpacing: "-0.03em",
						color: CYAN,
					}}
				>
					private den.
				</div>
				<div style={{ fontSize: "30px", color: FG_DIM, marginTop: "12px" }}>
					Self-hosted invite-only live streaming on Cloudflare.
				</div>
			</div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					fontSize: "20px",
					color: FG_FAINT,
				}}
			>
				<span>github.com/MrDemonWolf/howlcast</span>
				<span style={{ color: CYAN }}>● Free + Open Source</span>
			</div>
		</div>,
		{ ...size },
	);
}
