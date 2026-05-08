import { cn } from "@howlcast/ui/lib/utils";
import type { ReactNode } from "react";

export type ChannelLayoutProps = {
	main: ReactNode;
	chat: ReactNode;
	className?: string;
};

// Two-column live shell from design-handoff/howcast-v2/project/HowlCast.html:
// 1fr main column + --chat-dock-w chat dock at lg+; collapses to single column under lg.
// Border between columns at lg+ (no gap), gap-6 on mobile (no border).
export function ChannelLayout({ main, chat, className }: ChannelLayoutProps) {
	return (
		<div
			className={cn(
				"grid w-full grid-cols-1 gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_var(--chat-dock-w)] lg:gap-0 lg:py-0",
				className,
			)}
		>
			<div className="flex min-w-0 flex-col gap-6 px-[var(--gutter-x)] lg:px-[var(--gutter-x-lg)] lg:py-8">
				{main}
			</div>
			<aside className="flex min-h-[480px] flex-col lg:sticky lg:top-0 lg:h-svh lg:border-l lg:border-[var(--line)]">
				{chat}
			</aside>
		</div>
	);
}
