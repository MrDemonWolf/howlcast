"use client";

// GetStream Chat dock. Two mount paths:
//
// 1. Authenticated viewers / broadcaster — use `useCreateChatClient` from
//    stream-chat-react. Hook owns the connect/disconnect lifecycle, returns
//    null until WS is up. Per-component instance (no singleton sharing
//    between channel-page and dashboard-chat).
//
// 2. Anonymous viewers — use a dedicated hook that calls
//    `connectAnonymousUser`. Anon connections don't count toward MAU and
//    livestream channel type allows anon read by default.

import "stream-chat-react/dist/css/index.css";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { StreamChat } from "stream-chat";
import {
	Channel,
	Chat,
	defaultAllowedTagNames,
	MessageComposer,
	MessageList,
	renderText,
	useCreateChatClient,
	Window,
} from "stream-chat-react";

import { trpc } from "@/utils/trpc";
import { emoteRehypePlugin, type EmoteRecord } from "./emote-renderer";

type AuthedProps = {
	apiKey: string;
	userId: string;
	token: string;
	channelCid: string;
	canPost: boolean;
};

type AnonProps = {
	apiKey: string;
	channelCid: string;
};

type Props = (AuthedProps & { kind?: "user" }) | (AnonProps & { kind: "anonymous" });

export default function LiveChat(props: Props) {
	if (props.kind === "anonymous") {
		return <AnonLiveChat apiKey={props.apiKey} channelCid={props.channelCid} />;
	}
	return (
		<AuthedLiveChat
			apiKey={props.apiKey}
			userId={props.userId}
			token={props.token}
			channelCid={props.channelCid}
			canPost={props.canPost}
		/>
	);
}

function AuthedLiveChat({ apiKey, userId, token, channelCid, canPost }: AuthedProps) {
	const client = useCreateChatClient({
		apiKey,
		tokenOrProvider: token,
		userData: { id: userId },
	});
	return <ChatBody client={client} channelCid={channelCid} canPost={canPost} />;
}

function AnonLiveChat({ apiKey, channelCid }: AnonProps) {
	const [client, setClient] = useState<StreamChat | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const c = new StreamChat(apiKey);
		let cancelled = false;
		const promise = c.connectAnonymousUser();
		// connectAnonymousUser returns undefined on the server; in the browser it
		// resolves to a ConnectAPIResponse — guard either way.
		Promise.resolve(promise)
			.then(() => {
				if (!cancelled) setClient(c);
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Couldn't connect to chat.");
				}
			});
		return () => {
			cancelled = true;
			setClient(null);
			c.disconnectUser().catch(() => {});
		};
	}, [apiKey]);

	if (error) return <ChatError message={error} />;
	return <ChatBody client={client} channelCid={channelCid} canPost={false} />;
}

function ChatBody({
	client,
	channelCid,
	canPost,
}: {
	client: StreamChat | null;
	channelCid: string;
	canPost: boolean;
}) {
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
				// img must be explicitly allowed or sanitizer strips emote tags
				allowedTagNames: [...defaultAllowedTagNames, "img"],
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				getRehypePlugins: (defaults) => [emoteRehypePlugin(emoteMap), ...defaults] as any,
			}),
		[emoteMap],
	);

	const [type, id] = channelCid.split(":");
	const channel = useMemo(
		() => (client && type && id ? client.channel(type, id) : null),
		[client, type, id],
	);

	if (!client || !channel) {
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
					<MessageList renderText={customRenderText} />
					{canPost ? <MessageComposer /> : null}
				</Window>
			</Channel>
		</Chat>
	);
}

function ChatError({ message }: { message: string }) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 text-center text-muted-foreground text-xs">
			<span className="font-mono uppercase tracking-wider">Chat unavailable</span>
			<span className="text-fg-3">{message}</span>
		</div>
	);
}
