"use client";

import { BRAND } from "@howlcast/config/brand";

// Fallback when error happens inside the root layout itself. Replaces the
// entire HTML document, so it cannot use the app's layout (no var() resolution
// here — must inline brand hex via @howlcast/config/brand).
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
	return (
		<html lang="en" className="dark">
			<body
				style={{
					margin: 0,
					minHeight: "100vh",
					display: "grid",
					placeItems: "center",
					backgroundColor: BRAND.navy,
					color: BRAND.ogFg,
					fontFamily:
						'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
					padding: "24px",
				}}
			>
				<div style={{ maxWidth: 420, textAlign: "center" }}>
					<div
						style={{
							fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
							fontSize: 10,
							letterSpacing: "0.2em",
							color: BRAND.cyan,
							textTransform: "uppercase",
							marginBottom: 12,
						}}
					>
						Fatal error
					</div>
					<h1 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 12px" }}>
						HowlCast hit the floor.
					</h1>
					<p style={{ fontSize: 14, color: BRAND.ogFgDim, margin: "0 0 20px" }}>
						The page failed to load. Reload the page or try again later.
					</p>
					<button
						type="button"
						onClick={reset}
						style={{
							background: BRAND.cyan,
							color: BRAND.navy,
							border: 0,
							padding: "8px 16px",
							fontSize: 14,
							fontWeight: 500,
							borderRadius: 6,
							cursor: "pointer",
						}}
					>
						Try again
					</button>
				</div>
			</body>
		</html>
	);
}
