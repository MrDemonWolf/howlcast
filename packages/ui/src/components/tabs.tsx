"use client";

import { cn } from "@howlcast/ui/lib/utils";
import {
	type ButtonHTMLAttributes,
	createContext,
	type ReactNode,
	useContext,
	useState,
} from "react";

interface TabsContextValue {
	value: string;
	setValue: (v: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string) {
	const ctx = useContext(TabsContext);
	if (!ctx) throw new Error(`${component} must be used inside <Tabs>`);
	return ctx;
}

export function Tabs({
	value: controlled,
	defaultValue,
	onValueChange,
	className,
	children,
}: {
	value?: string;
	defaultValue?: string;
	onValueChange?: (v: string) => void;
	className?: string;
	children: ReactNode;
}) {
	const [internal, setInternal] = useState(defaultValue ?? "");
	const value = controlled ?? internal;
	const setValue = (v: string) => {
		if (controlled === undefined) setInternal(v);
		onValueChange?.(v);
	};
	return (
		<TabsContext.Provider value={{ value, setValue }}>
			<div className={className}>{children}</div>
		</TabsContext.Provider>
	);
}

export function TabsList({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<div
			role="tablist"
			className={cn(
				"inline-flex items-center gap-1 rounded-lg border border-border bg-muted p-1",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function TabsTrigger({
	value,
	className,
	children,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
	const ctx = useTabsContext("TabsTrigger");
	const active = ctx.value === value;
	return (
		<button
			type="button"
			role="tab"
			aria-selected={active}
			data-state={active ? "active" : "inactive"}
			onClick={() => ctx.setValue(value)}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-xs transition-colors",
				active
					? "bg-background text-foreground shadow-sm"
					: "text-muted-foreground hover:text-foreground",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}

export function TabsContent({
	value,
	className,
	children,
}: {
	value: string;
	className?: string;
	children: ReactNode;
}) {
	const ctx = useTabsContext("TabsContent");
	if (ctx.value !== value) return null;
	return (
		<div role="tabpanel" className={cn("mt-4", className)}>
			{children}
		</div>
	);
}
