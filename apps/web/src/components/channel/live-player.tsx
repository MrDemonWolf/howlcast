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
	onViewerCount?: (count: number) => void;
};

export default function LivePlayer({ apiKey, userId, token, callId, onViewerCount }: Props) {
	// Canonical pattern: useState+useEffect so disconnectUser fires on unmount.
	// useMemo doesn't guarantee cleanup — old WebSocket leaks on hot reload and
	// navigation. In dev React Strict Mode double-invokes, creating two clients.
	const [client, setClient] = useState<StreamVideoClient>();
	const [call, setCall] = useState<Call>();

	useEffect(() => {
		const c = new StreamVideoClient({ apiKey, user: { id: userId }, token });
		setClient(c);
		return () => {
			c.disconnectUser().catch(() => {});
			setClient(undefined);
		};
	}, [apiKey, userId, token]);

	useEffect(() => {
		if (!client) return;
		const c = client.call("livestream", callId);
		setCall(c);
		// join() is required for the SDK to populate call state and for
		// LivestreamPlayer to receive the WebRTC stream.
		c.join().catch((e) => console.error("LivePlayer: failed to join call", e));
		return () => {
			c.leave().catch(() => {});
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
