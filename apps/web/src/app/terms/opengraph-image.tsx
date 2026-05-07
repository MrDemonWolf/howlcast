import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Terms of Service · HowlCast";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TermsOG() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "flex-start",
				padding: "96px",
				background: "#091533",
				color: "#e6ecff",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<div
				style={{
					fontSize: "20px",
					fontFamily: "monospace",
					letterSpacing: "0.2em",
					textTransform: "uppercase",
					color: "#0FACED",
					marginBottom: "32px",
				}}
			>
				LEGAL · TERMS
			</div>
			<div style={{ fontSize: "104px", fontWeight: 700, lineHeight: 1 }}>Terms of Service</div>
			<div style={{ fontSize: "28px", color: "#aab4d3", marginTop: "16px" }}>
				The rules for using HowlCast.
			</div>
		</div>,
		{ ...size },
	);
}
