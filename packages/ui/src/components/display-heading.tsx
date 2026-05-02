import { cn } from "@howlcast/ui/lib/utils";
import type { ElementType, HTMLAttributes } from "react";

// Display heading — Bricolage font + tight tracking. Used for page titles,
// section headers, and the wordmark. Centralised so size/weight/spacing tweaks
// hit one file.
type Size = "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_CLASS: Record<Size, string> = {
	sm: "text-lg",
	md: "text-2xl",
	lg: "text-3xl",
	xl: "text-4xl sm:text-5xl",
	"2xl": "text-5xl sm:text-6xl",
};

interface DisplayHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
	as?: ElementType;
	size?: Size;
}

export function DisplayHeading({
	as: Tag = "h1",
	size = "lg",
	className,
	children,
	...props
}: DisplayHeadingProps) {
	return (
		<Tag
			className={cn(
				"font-display font-semibold text-foreground tracking-tight",
				SIZE_CLASS[size],
				className,
			)}
			style={{ fontFamily: "var(--font-display)" }}
			{...props}
		>
			{children}
		</Tag>
	);
}
