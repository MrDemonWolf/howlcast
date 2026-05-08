import { cn } from "@howlcast/ui/lib/utils";

export type StatusKind = "pending" | "accepted" | "expired" | "error";

interface StatusPillProps {
	kind: StatusKind;
	children: React.ReactNode;
	className?: string;
}

/** Mono-typed status pill with a coloured dot — used for invites, webhook events, etc. */
export function StatusPill({ kind, children, className }: StatusPillProps) {
	return (
		<span data-slot="status-pill" className={cn("status-pill", `status-${kind}`, className)}>
			{children}
		</span>
	);
}
