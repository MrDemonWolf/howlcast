"use client";

// Real GetStream Chat dock. Lazy-loaded from channel-page.tsx (200KB SDK).
// Same JWT signs both Video and Chat per the integration doc — we receive
// the token from `stream.getViewerToken` upstream.
//
// In invite-only mode, anonymous viewers get a read-only experience: they
// can watch but not post. The `canPost` flag is computed upstream from
// `profiles.isInvited` — false for guests, true for invited members.

import "stream-chat-react/dist/css/v2/index.css";

import { useEffect, useMemo, useState } from "react";
import { StreamChat } from "stream-chat";
import { Channel, Chat, MessageComposer, MessageList, Window } from "stream-chat-react";

type Props = {
	apiKey: string;
	userId: string;
	token: string;
	channelCid: string;
	canPost: boolean;
};

export default function LiveChat({ apiKey, userId, token, channelCid, canPost }: Props) {
	const client = useMemo(() => StreamChat.getInstance(apiKey), [apiKey]);
	const [ready, setReady] = useState(false);

	// Connect / disconnect on mount. Reusing the singleton means a fast
	// remount during dev doesn't open two sockets.
	useEffect(() => {
		let cancelled = false;
		client
			.connectUser({ id: userId }, token)
			.then(() => {
				if (!cancelled) setReady(true);
			})
			.catch(() => {
				/* surfaced via tRPC error path — ignore here */
			});
		return () => {
			cancelled = true;
			client.disconnectUser();
		};
	}, [client, userId, token]);

	const [type, id] = channelCid.split(":");
	const channel = useMemo(
		() => (ready && type && id ? client.channel(type, id) : null),
		[client, ready, type, id],
	);

	if (!ready || !channel) {
		return (
			<div className="flex flex-1 items-center justify-center text-muted-foreground text-xs">
				Connecting…
			</div>
		);
	}

	return (
		<Chat client={client} theme="str-chat__theme-dark">
			<Channel channel={channel}>
				<Window>
					<MessageList />
					{canPost ? <MessageComposer /> : null}
				</Window>
			</Channel>
		</Chat>
	);
}
