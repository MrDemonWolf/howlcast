import { cn } from "@howlcast/ui/lib/utils";

interface SparklineProps {
	points: number[];
	width?: number;
	height?: number;
	fill?: boolean;
	className?: string;
}

/** SVG line-chart in cyan. Used in dashboard tiles. */
export function Sparkline({
	points,
	width = 160,
	height = 36,
	fill = false,
	className,
}: SparklineProps) {
	if (points.length < 2) return null;
	const max = Math.max(...points);
	const min = Math.min(...points);
	const range = max - min || 1;
	const step = width / (points.length - 1);
	const path = points
		.map(
			(p, i) =>
				`${i === 0 ? "M" : "L"} ${i * step} ${height - ((p - min) / range) * (height - 4) - 2}`,
		)
		.join(" ");
	return (
		<svg
			data-slot="sparkline"
			width={width}
			height={height}
			className={cn("spark", className)}
			style={{ display: "block", overflow: "visible" }}
			aria-hidden="true"
		>
			{fill && (
				<path
					d={`${path} L ${width} ${height} L 0 ${height} Z`}
					fill="currentColor"
					opacity={0.12}
				/>
			)}
			<path
				d={path}
				stroke="currentColor"
				strokeWidth={1.5}
				fill="none"
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
		</svg>
	);
}
