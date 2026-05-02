"use client";

// Real GetStream Video player. Lazy-loaded from channel-page.tsx so the
// 200KB SDK bundle doesn't ship with the initial page load — anonymous
// viewers landing on /` get the offline placeholder, only live viewers
// pay the cost.

import {
	LivestreamPlayer,
	StreamCall,
	StreamVideo,
	StreamVideoClient,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useMemo } from "react";

type Props = {
	apiKey: string;
	userId: string;
	token: string;
	callId: string;
};

export default function LivePlayer({ apiKey, userId, token, callId }: Props) {
	// Memoize the client so React 18 strict-mode double-invoke doesn't open
	// two WebSocket connections to GetStream during dev.
	const client = useMemo(
		() => new StreamVideoClient({ apiKey, user: { id: userId }, token }),
		[apiKey, userId, token],
	);

	const call = useMemo(() => client.call("livestream", callId), [client, callId]);

	return (
		<StreamVideo client={client}>
			<StreamCall call={call}>
				<LivestreamPlayer callType="livestream" callId={callId} />
			</StreamCall>
		</StreamVideo>
	);
}
