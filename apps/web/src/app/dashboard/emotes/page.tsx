import HeaderStrip from "@/components/dashboard/header-strip";
import EmotesGrid from "@/components/dashboard/emotes/emotes-grid";

export const metadata = { title: "Emotes · HowlCast" };

export default function EmotesPage() {
	return (
		<>
			<HeaderStrip title="Emotes" subtitle="Channel · merged from Twitch / 7TV / BTTV / FFZ" />
			<EmotesGrid />
		</>
	);
}
