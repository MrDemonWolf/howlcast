import { cn } from "@howlcast/ui/lib/utils";

interface LivePillProps {
	children?: React.ReactNode;
	className?: string;
}

/** LIVE pill — red background with a pulsing dot. */
export function LivePill({ children = "LIVE", className }: LivePillProps) {
	return (
		<span data-slot="live-pill" className={cn("live-pill", className)}>
			<span className="live-dot" aria-hidden="true" />
			{children}
		</span>
	);
}
