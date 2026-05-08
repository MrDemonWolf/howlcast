import { cn } from "@howlcast/ui/lib/utils";
import type { ReactNode } from "react";

export type ChannelLayoutProps = {
	main: ReactNode;
	chat: ReactNode;
	className?: string;
};

// Two-column live shell from design-handoff/project/HowlCast.html:
// 1fr main column + 340px chat dock at lg+; collapses to single column under lg.
// Width/padding live in tokens (--container-prose for the inner main column,
// --gutter-x for page edges).
export function ChannelLayout({ main, chat, className }: ChannelLayoutProps) {
	return (
		<div
			className={cn(
				"mx-auto grid w-full max-w-[var(--container-wide)] grid-cols-1 gap-6 px-[var(--gutter-x)] py-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:px-[var(--gutter-x-lg)] lg:py-8",
				className,
			)}
		>
			<div className="flex min-w-0 flex-col gap-6">{main}</div>
			<aside className="flex min-h-[480px] flex-col lg:sticky lg:top-6 lg:max-h-[calc(100svh-3rem)]">
				{chat}
			</aside>
		</div>
	);
}
