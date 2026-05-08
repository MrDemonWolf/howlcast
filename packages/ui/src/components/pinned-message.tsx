import { Pin } from "lucide-react";
import { cn } from "@howlcast/ui/lib/utils";

interface PinnedMessageProps {
	children: React.ReactNode;
	className?: string;
}

/** Cyan-edged "PINNED" strip used at the top of the chat dock. */
export function PinnedMessage({ children, className }: PinnedMessageProps) {
	return (
		<div data-slot="pinned-message" className={cn("pinned-strip", className)}>
			<Pin size={12} aria-hidden="true" />
			<div>
				<span className="eyebrow mr-2">PINNED</span>
				{children}
			</div>
		</div>
	);
}
