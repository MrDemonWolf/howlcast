import HeaderStrip from "@/components/dashboard/header-strip";
import PanelsEditor from "@/components/dashboard/panels/panels-editor";

export const metadata = { title: "Panels · HowlCast" };

export default function PanelsPage() {
	return (
		<>
			<HeaderStrip title="Panels" subtitle="Channel · cards below the player" />
			<PanelsEditor />
		</>
	);
}
