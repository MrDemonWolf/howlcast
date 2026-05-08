import { Eye } from "lucide-react";
import { cn } from "@howlcast/ui/lib/utils";

interface ViewerChipProps {
	count: number;
	className?: string;
}

/** Glassy chip with eye icon + viewer count, designed to overlay the player. */
export function ViewerChip({ count, className }: ViewerChipProps) {
	return (
		<span
			data-slot="viewer-chip"
			className={cn("viewer-chip", className)}
			aria-label={`${count.toLocaleString()} viewers`}
		>
			<Eye size={12} strokeWidth={2} />
			{count.toLocaleString()}
		</span>
	);
}
