import { Eyebrow } from "@howlcast/ui/components/eyebrow";
import { cn } from "@howlcast/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

export type ContentSectionProps = ComponentProps<"section"> & {
	eyebrow?: string;
	title?: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
};

// Standard section wrapper for settings/dashboard/account pages.
// Header row (eyebrow + title + description + actions) above children.
// Vertical rhythm uses --section-y between siblings.
export function ContentSection({
	eyebrow,
	title,
	description,
	actions,
	className,
	children,
	...props
}: ContentSectionProps) {
	const hasHeader = eyebrow || title || description || actions;
	return (
		<section
			className={cn("flex flex-col gap-4 [&+section]:mt-[var(--section-y)]", className)}
			{...props}
		>
			{hasHeader && (
				<div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
					<div className="flex flex-col gap-1">
						{eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
						{title && (
							<h2
								className="font-display font-medium text-2xl tracking-tight"
								style={{ color: "var(--fg)" }}
							>
								{title}
							</h2>
						)}
						{description && (
							<p className="text-sm" style={{ color: "var(--fg-3)" }}>
								{description}
							</p>
						)}
					</div>
					{actions && <div className="flex items-center gap-2">{actions}</div>}
				</div>
			)}
			<div className="flex flex-col gap-4">{children}</div>
		</section>
	);
}
