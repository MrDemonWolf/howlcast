"use client";

// Fallback when error happens inside the root layout itself. Replaces the
// entire HTML document, so it cannot use the app's layout.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
	return (
		<html lang="en" className="dark">
			<body
				style={{
					margin: 0,
					minHeight: "100vh",
					display: "grid",
					placeItems: "center",
					backgroundColor: "#091533",
					color: "#e6ecff",
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
							color: "#0FACED",
							textTransform: "uppercase",
							marginBottom: 12,
						}}
					>
						Fatal error
					</div>
					<h1 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 12px" }}>
						HowlCast hit the floor.
					</h1>
					<p style={{ fontSize: 14, color: "#aab4d3", margin: "0 0 20px" }}>
						The page failed to load. Reload the page or try again later.
					</p>
					<button
						type="button"
						onClick={reset}
						style={{
							background: "#0FACED",
							color: "#091533",
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
