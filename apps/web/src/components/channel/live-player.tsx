"use client";

// Real GetStream Video player. Lazy-loaded from channel-page.tsx so the
// 200KB SDK bundle doesn't ship with the initial page load — anonymous
// viewers landing on `/` get the offline placeholder, only live viewers
// pay the cost.

import {
	LivestreamPlayer,
	StreamCall,
	StreamVideo,
	StreamVideoClient,
	useCallStateHooks,
	type Call,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useEffect, useState } from "react";

type Props = {
	apiKey: string;
	userId: string;
	token: string;
	callId: string;
	isGuest?: boolean;
	onViewerCount?: (count: number) => void;
};

export default function LivePlayer({
	apiKey,
	userId,
	token,
	callId,
	isGuest = false,
	onViewerCount,
}: Props) {
	const [client, setClient] = useState<StreamVideoClient>();
	const [call, setCall] = useState<Call>();

	useEffect(() => {
		// Anonymous viewers use the SDK's anonymous user shape — the JWT carries
		// `call_cids` scoping which call they may watch (signed server-side).
		const c = isGuest
			? new StreamVideoClient({ apiKey, user: { type: "anonymous" }, token })
			: new StreamVideoClient({ apiKey, user: { id: userId }, token });
		setClient(c);
		return () => {
			c.disconnectUser().catch(() => {});
			setClient(undefined);
		};
	}, [apiKey, userId, token, isGuest]);

	useEffect(() => {
		if (!client) return;
		// Create the call object for hook context; LivestreamPlayer joins
		// internally so we don't call c.join() ourselves.
		const c = client.call("livestream", callId);
		setCall(c);
		return () => {
			setCall(undefined);
		};
	}, [client, callId]);

	if (!client || !call) return null;

	return (
		<StreamVideo client={client}>
			<StreamCall call={call}>
				<LivestreamView callId={callId} onViewerCount={onViewerCount} />
			</StreamCall>
		</StreamVideo>
	);
}

// Inner component so useCallStateHooks has access to <StreamCall> context.
function LivestreamView({
	callId,
	onViewerCount,
}: {
	callId: string;
	onViewerCount?: (count: number) => void;
}) {
	const { useParticipantCount } = useCallStateHooks();
	const count = useParticipantCount();

	useEffect(() => {
		onViewerCount?.(count);
	}, [count, onViewerCount]);

	return <LivestreamPlayer callType="livestream" callId={callId} />;
}
