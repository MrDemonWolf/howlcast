import { cn } from "@howlcast/ui/lib/utils";
import type { ComponentProps } from "react";

type Variant = "narrow" | "form" | "prose" | "wide";

const widthClass: Record<Variant, string> = {
	narrow: "max-w-[var(--container-narrow)]",
	form: "max-w-[var(--container-form)]",
	prose: "max-w-[var(--container-prose)]",
	wide: "max-w-[var(--container-wide)]",
};

export type PageContainerProps = ComponentProps<"main"> & {
	variant?: Variant;
};

export function PageContainer({ variant = "form", className, ...props }: PageContainerProps) {
	return (
		<main
			className={cn(
				"mx-auto w-full px-[var(--gutter-x)] py-10 lg:px-[var(--gutter-x-lg)]",
				widthClass[variant],
				className,
			)}
			{...props}
		/>
	);
}
