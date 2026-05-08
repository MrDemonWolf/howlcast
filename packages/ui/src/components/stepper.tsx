import { Fragment } from "react";
import { cn } from "@howlcast/ui/lib/utils";

interface StepperProps {
	count: number;
	step: number;
	className?: string;
}

/** Horizontal dot-and-line progress indicator with a mono "01 / 03" label. */
export function Stepper({ count, step, className }: StepperProps) {
	return (
		<div
			data-slot="stepper"
			className={cn("flex items-center gap-1.5", className)}
			role="progressbar"
			aria-valuemin={1}
			aria-valuemax={count}
			aria-valuenow={step + 1}
		>
			{Array.from({ length: count }).map((_, i) => (
				<Fragment key={i}>
					<span
						className="rounded-full"
						style={{
							width: 8,
							height: 8,
							background: i <= step ? "var(--cyan)" : "var(--bg-4)",
						}}
					/>
					{i < count - 1 && (
						<span
							style={{
								width: 24,
								height: 1,
								background: i < step ? "var(--cyan)" : "var(--line)",
							}}
						/>
					)}
				</Fragment>
			))}
			<span
				className="ml-2.5"
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: 11,
					color: "var(--fg-3)",
				}}
			>
				{String(step + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
			</span>
		</div>
	);
}
