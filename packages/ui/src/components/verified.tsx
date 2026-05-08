import { Check } from "lucide-react";
import { cn } from "@howlcast/ui/lib/utils";

interface VerifiedProps {
	size?: number;
	className?: string;
}

/** Cyan starburst-style verified mark. Custom — not Twitter blue, not Twitch purple. */
export function Verified({ size = 16, className }: VerifiedProps) {
	return (
		<span
			data-slot="verified"
			className={cn("verified", className)}
			style={{ width: size, height: size }}
			aria-label="Verified"
		>
			<Check size={Math.round(size * 0.7)} strokeWidth={3} />
		</span>
	);
}
