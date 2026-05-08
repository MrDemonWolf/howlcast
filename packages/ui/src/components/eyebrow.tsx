import { cn } from "@howlcast/ui/lib/utils";

interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
	children: React.ReactNode;
}

/** Mono uppercase 10px label used above section titles. */
export function Eyebrow({ children, className, ...rest }: EyebrowProps) {
	return (
		<span data-slot="eyebrow" className={cn("eyebrow", className)} {...rest}>
			{children}
		</span>
	);
}
