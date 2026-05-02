import ChannelPage from "@/components/channel/channel-page";

// Single tenant: the channel page IS the home page. No /[username] routing.
export default function Home() {
	return <ChannelPage />;
}
