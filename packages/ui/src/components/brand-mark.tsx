import { cn } from "@howlcast/ui/lib/utils";

interface BrandMarkProps {
	size?: number;
	/** Pass `false` to render the wolf glyph alone, or override the wordmark text. */
	brandName?: string | false;
	color?: string;
	className?: string;
}

/**
 * HowlCast brand mark — the Howl Arc wolf glyph + optional wordmark.
 * Default cyan stroke, navy fill on the centre wedge. Mirrors the prototype
 * BrandMark in design-handoff/howcast-v2/project/components.jsx.
 */
export function BrandMark({ size = 24, brandName, color, className }: BrandMarkProps) {
	const stroke = color ?? "var(--cyan)";
	const showWord = brandName !== false;
	return (
		<span className={cn("inline-flex items-center gap-2.5", className)} data-slot="brand-mark">
			<svg
				width={size}
				height={size}
				viewBox="0 0 100 100"
				fill="none"
				stroke={stroke}
				strokeWidth="6"
				strokeLinecap="round"
				aria-hidden="true"
			>
				<path d="M 18 64 A 32 32 0 0 1 82 64" />
				<path d="M 30 64 A 20 20 0 0 1 70 64" />
				<path d="M 42 64 A 8 8 0 0 1 58 64" />
				<path d="M 42 64 L 50 80 L 58 64 Z" fill={stroke} stroke="none" />
			</svg>
			{showWord && (
				<span
					className="font-display font-bold"
					style={{
						fontFamily: "var(--font-display)",
						letterSpacing: "-0.02em",
						fontSize: 16,
					}}
				>
					{brandName ?? "HowlCast"}
				</span>
			)}
		</span>
	);
}
