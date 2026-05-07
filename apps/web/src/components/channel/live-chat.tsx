"use client";

// Real GetStream Chat dock. Lazy-loaded from channel-page.tsx (200KB SDK).
// Same JWT signs both Video and Chat per the integration doc — we receive
// the token from `stream.getViewerToken` upstream.
//
// In invite-only mode, anonymous viewers get a read-only experience: they
// can watch but not post. The `canPost` flag is computed upstream from
// `profiles.isInvited` — false for guests, true for invited members.

import "stream-chat-react/dist/css/index.css";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { StreamChat } from "stream-chat";
import {
	Channel,
	Chat,
	MessageComposer,
	MessageList,
	defaultAllowedTagNames,
	renderText,
	Window,
} from "stream-chat-react";

import { trpc } from "@/utils/trpc";
import { emoteRehypePlugin, type EmoteRecord } from "./emote-renderer";

type Props = {
	apiKey: string;
	userId: string;
	token: string;
	channelCid: string;
	canPost: boolean;
};

export default function LiveChat({ apiKey, userId, token, channelCid, canPost }: Props) {
	// Canonical pattern per GetStream GH issue #1487:
	// Store the connected client in state so React unmounts <Chat> BEFORE
	// disconnectUser fires — prevents "Both secret and user tokens are not
	// set" when the component remounts (Strict Mode, token re-fetch, etc.).
	const [chatClient, setChatClient] = useState<StreamChat | null>(null);
	const [error, setError] = useState<string | null>(null);

	const emotes = useQuery(trpc.channel.getEmotes.queryOptions());
	const emoteMap = useMemo(() => {
		const m = new Map<string, EmoteRecord>();
		for (const e of emotes.data?.emotes ?? []) {
			m.set(e.name, { id: e.id, name: e.name, url1x: e.url1x, url2x: e.url2x });
		}
		return m;
	}, [emotes.data]);

	const customRenderText: typeof renderText = useMemo(
		() => (text, mentioned) =>
			renderText(text, mentioned, {
				// img must be explicitly allowed or the sanitizer strips emote tags
				allowedTagNames: [...defaultAllowedTagNames, "img"],
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				getRehypePlugins: (defaults) => [emoteRehypePlugin(emoteMap), ...defaults] as any,
			}),
		[emoteMap],
	);

	useEffect(() => {
		if (!apiKey || !userId || !token) {
			setError("Stream credentials missing.");
			return;
		}

		setError(null);
		const client = StreamChat.getInstance(apiKey);
		let cancelled = false;

		client
			.connectUser({ id: userId }, token)
			.then(() => {
				if (!cancelled) setChatClient(client);
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Couldn't connect to chat.");
				}
			});

		return () => {
			cancelled = true;
			// Null the client from state first — this unmounts <Chat> before
			// disconnect fires, preventing children from reading a stale client.
			setChatClient(null);
			client.disconnectUser().catch(() => {});
		};
	}, [apiKey, userId, token]);

	const [type, id] = channelCid.split(":");
	const channel = useMemo(
		() => (chatClient && type && id ? chatClient.channel(type, id) : null),
		[chatClient, type, id],
	);

	if (error) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 text-center text-muted-foreground text-xs">
				<span className="font-mono uppercase tracking-wider">Chat unavailable</span>
				<span className="text-fg-3">{error}</span>
			</div>
		);
	}
	if (!chatClient || !channel) {
		return (
			<div className="flex flex-1 items-center justify-center text-muted-foreground text-xs">
				Connecting…
			</div>
		);
	}

	return (
		<Chat client={chatClient} theme="str-chat__theme-dark">
			<Channel channel={channel}>
				<Window>
					<MessageList renderText={customRenderText} />
					{canPost ? <MessageComposer /> : null}
				</Window>
			</Channel>
		</Chat>
	);
}
