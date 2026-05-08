"use client";

// Dashboard chat surface. Same lazy-loaded LiveChat the channel page
// uses, plus a "Pop out" button. The popout opens /popout/chat which
// renders the same chat with no chrome — works as an OBS browser
// source or a docked second window.

import { Button } from "@howlcast/ui/components/button";
import { Card } from "@howlcast/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import dynamic from "next/dynamic";

import { trpc } from "@/utils/trpc";

const LiveChat = dynamic(() => import("@/components/channel/live-chat"), {
	ssr: false,
	loading: () => (
		<div className="flex flex-1 items-center justify-center text-muted-foreground text-xs">
			Loading chat…
		</div>
	),
});

export default function DashboardChat({ popoutOnly = false }: { popoutOnly?: boolean }) {
	const credentials = useQuery({
		...trpc.stream.getStreamCredentials.queryOptions(),
		retry: false,
	});
	const broadcaster = useQuery({
		...trpc.stream.getBroadcasterToken.queryOptions(),
		retry: false,
	});

	const ready = !!broadcaster.data && !!credentials.data?.callId && !!credentials.data?.channelCid;

	return (
		<div className={popoutOnly ? "h-svh" : "flex h-[680px] flex-col"}>
			{!popoutOnly ? (
				<div className="mb-3 flex items-center justify-between">
					<p className="text-muted-foreground text-sm">
						Same chat the viewers see. Pop out for OBS or a second monitor.
					</p>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={() => window.open("/popout/chat", "howlcast-chat", "width=380,height=640")}
					>
						<ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden />
						Pop out
					</Button>
				</div>
			) : null}

			<Card className="flex-1 gap-0 py-0">
				{ready ? (
					<LiveChat
						apiKey={broadcaster.data!.apiKey}
						userId={broadcaster.data!.userId}
						token={broadcaster.data!.userToken}
						channelCid={credentials.data!.channelCid!}
						canPost={true}
					/>
				) : (
					<div className="flex flex-1 items-center justify-center px-6 text-center text-muted-foreground text-sm">
						{credentials.data?.callId
							? "Connecting chat…"
							: "Provision the stream first to enable chat."}
					</div>
				)}
			</Card>
		</div>
	);
}
