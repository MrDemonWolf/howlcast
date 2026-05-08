import { cn } from "@howlcast/ui/lib/utils";

interface TagProps {
	children: React.ReactNode;
	className?: string;
}

/** Subtle outlined pill used for channel tags / metadata chips. */
export function Tag({ children, className }: TagProps) {
	return (
		<span data-slot="tag" className={cn("tag-pill", className)}>
			{children}
		</span>
	);
}
