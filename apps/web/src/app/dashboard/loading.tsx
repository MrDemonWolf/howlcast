export default function DashboardLoading() {
	return (
		<div className="flex flex-col gap-6">
			<div className="h-12 w-1/3 animate-pulse rounded-md bg-bg-2" />
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div className="h-24 animate-pulse rounded-lg border border-border bg-card" />
				<div className="h-24 animate-pulse rounded-lg border border-border bg-card" />
				<div className="h-24 animate-pulse rounded-lg border border-border bg-card" />
			</div>
			<div className="h-64 animate-pulse rounded-lg border border-border bg-card" />
		</div>
	);
}
