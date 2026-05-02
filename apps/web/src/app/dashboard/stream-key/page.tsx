import HeaderStrip from "@/components/dashboard/header-strip";
import RtmpsCard from "@/components/dashboard/stream/rtmps-card";

export const metadata = { title: "Stream key · HowlCast" };

export default function StreamKeyPage() {
	return (
		<>
			<HeaderStrip title="Stream key" subtitle="Channel · OBS RTMPS connection" />
			<RtmpsCard />
			<section className="rounded-lg border border-border bg-card p-5 text-muted-foreground text-sm">
				<p className="font-medium text-foreground">Heads up</p>
				<p className="mt-2">
					Your stream key is your signed broadcaster JWT. It rotates automatically when the call is
					re-provisioned. Don't share it.
				</p>
			</section>
		</>
	);
}
