# GetStream Integration

> **TL;DR:** Sign JWTs in your Worker with WebCrypto, hand them to the browser SDKs, OBS pushes via RTMPS, viewers watch via WebRTC. Webhooks tell you when streams start/stop.

## What you'll find here

1. How GetStream fits in (architecture)
2. JWT signing (Worker, no external SDK)
3. Creating the livestream call
4. Going live / stopping
5. Frontend video embed
6. Chat: linking to the call
7. Custom emote rendering
8. Roles and permissions
9. Webhook signature verification
10. Built-in moderation features

---

## How it fits

```
OBS encoder ──RTMPS──► GetStream ingress
                            │
                            ├── WebRTC (sub-second, default for viewers)
                            └── HLS (10-20s lag, mobile fallback)
                                       │
                                       ▼
                              Viewer browsers
```

**Your Worker's job:**
- Sign JWTs with `STREAM_API_SECRET`
- Call GetStream REST endpoints (create call, go live, etc.)
- Receive webhooks when stream state changes

**Your Worker is NEVER in the media path.** Stream content never touches Cloudflare.

---

## JWT signing (zero deps, WebCrypto)

The official `@stream-io/node-sdk` is not advertised as Workers-compatible. Sign manually:

```ts
// apps/server/src/lib/stream.ts
export async function signStreamUserToken(
  apiSecret: string,
  payload: { user_id: string; call_cids?: string[]; role?: string },
  ttlSec = 3600
) {
  const enc = new TextEncoder();
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { iat: now, exp: now + ttlSec, ...payload };

  const b64url = (obj: object | Uint8Array) => {
    const bytes = obj instanceof Uint8Array
      ? obj
      : enc.encode(JSON.stringify(obj));
    return btoa(String.fromCharCode(...bytes))
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  };

  const head = b64url({ alg: "HS256", typ: "JWT" });
  const body = b64url(fullPayload);
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, enc.encode(`${head}.${body}`))
  );
  return `${head}.${body}.${b64url(sig)}`;
}

// Server-only admin token (for REST calls to GetStream)
export const signAdminToken = (apiSecret: string) =>
  signStreamUserToken(apiSecret, { user_id: "" } as any, 3600);
```

**The same JWT works for both Video and Chat.** Sign once, init both clients.

---

## Creating the livestream call

```ts
const adminToken = await signAdminToken(env.STREAM_API_SECRET);

await fetch(
  `https://video.stream-io-api.com/api/v2/video/call/livestream/${broadcasterId}?api_key=${env.STREAM_API_KEY}`,
  {
    method: "POST",
    headers: {
      Authorization: adminToken,
      "stream-auth-type": "jwt",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        created_by_id: broadcasterId,
        members: [{ user_id: broadcasterId, role: "host" }],
        custom: { channelCid: `livestream:${broadcasterId}` },
      },
    }),
  }
);
```

Response includes `call.ingress.rtmp.address` — that's the **RTMPS server URL for OBS**. The user JWT you sign for the broadcaster **is the OBS stream key**.

---

## Going live / stopping

```ts
// Go live + start HLS as fallback
await fetch(
  `https://video.stream-io-api.com/api/v2/video/call/livestream/${broadcasterId}/go_live?api_key=${env.STREAM_API_KEY}`,
  {
    method: "POST",
    headers: {
      Authorization: adminToken,
      "stream-auth-type": "jwt",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ start_hls: true }),
  }
);

// Stop the stream
await fetch(
  `https://video.stream-io-api.com/api/v2/video/call/livestream/${broadcasterId}/stop_live?api_key=${env.STREAM_API_KEY}`,
  {
    method: "POST",
    headers: { Authorization: adminToken, "stream-auth-type": "jwt" },
  }
);
```

---

## Frontend video embed

```tsx
"use client";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  LivestreamPlayer,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

export function ChannelPlayer({ apiKey, userId, token, callId }: Props) {
  const client = new StreamVideoClient({
    apiKey,
    user: { id: userId },
    token,
  });

  return (
    <StreamVideo client={client}>
      <StreamCall call={client.call("livestream", callId)}>
        <LivestreamPlayer callType="livestream" callId={callId} />
      </StreamCall>
    </StreamVideo>
  );
}
```

**Latency note:** WebRTC is sub-second, HLS is 10–20s. Use WebRTC default. For invite-only mode you MUST use WebRTC (HLS m3u8 URLs aren't auth-gated by default).

---

## Chat: linking to the call

Use the **same ID** for both:

```ts
const channel = chatClient.channel("livestream", broadcasterId, {
  name: `${displayName}'s stream`,
});
await channel.create();
```

This binds the chat to the video call. Same JWT, same identity, single connection.

---

## Custom emote rendering

The `renderText` prop on `<MessageList>` runs a remark/rehype pipeline you can extend:

```tsx
import { renderText, defaultAllowedTagNames } from "stream-chat-react";
import { findAndReplace } from "hast-util-find-and-replace";
import { u } from "unist-builder";

const emoteRehypePlugin = (emoteMap: Map<string, EmoteRecord>) => () => (tree: any) => {
  // Word-level: match any whole word that exists in the emote map
  // (handles `FeelsGoodMan`-style word emotes, not just `:colon:` syntax)
  findAndReplace(tree, /\b([A-Za-z0-9_:!]+)\b/g, (full, word) => {
    const e = emoteMap.get(word);
    if (!e) return false;
    return u("element", {
      tagName: "img",
      properties: {
        src: e.url1x,
        srcset: `${e.url1x} 1x, ${e.url2x} 2x`,
        alt: word,
        dataEmoteId: e.id,
        className: "inline-emote",
      },
    }, []);
  });
};

const customRenderText = (emoteMap: Map<string, EmoteRecord>) =>
  (text: string, mentioned: User[]) =>
    renderText(text, mentioned, {
      allowedTagNames: [...defaultAllowedTagNames, "img"],
      getRehypePlugins: (defaults) => [emoteRehypePlugin(emoteMap), ...defaults],
    });

// Usage:
<MessageList renderText={customRenderText(emoteMap)} />
```

Then post-process in a custom `Message` component to swap raw `<img>` for `<EmoteWithTooltip>` components for hover previews.

---

## Roles and permissions

Configure once at app init (one-time script):

```ts
await streamChatClient.updateChannelType("livestream", {
  grants: {
    broadcaster: [
      "create-message", "update-any-message", "delete-any-message",
      "ban-user", "mute-user", "pin-message", "upload-attachment",
    ],
    user: [
      "create-message", "create-reaction", "read-channel",
    ],
    anonymous: ["read-channel"],
  },
  blocklist: "profanity_en_2020_v1",
  blocklist_behavior: "block",
  automod: "simple",
});
```

**No mod role** — the broadcaster handles all moderation directly. See [`../roles-and-notifications.md`](../roles-and-notifications.md).

Assign role per user: `await chatClient.upsertUser({ id, role: "user" })` for viewers, `role: "broadcaster"` for the streamer.

---

## Webhook signature verification

GetStream sends webhooks for `call.live_started`, `call.session_ended`, `call.ended`. Verify them:

```ts
async function verifyStreamWebhook(
  rawBody: string,
  sigHeader: string,
  apiSecret: string,
) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, enc.encode(rawBody))
  );
  const hex = Array.from(sig).map(b => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== sigHeader.length) return false;
  // Constant-time compare to prevent timing attacks
  let r = 0;
  for (let i = 0; i < hex.length; i++) {
    r |= hex.charCodeAt(i) ^ sigHeader.charCodeAt(i);
  }
  return r === 0;
}
```

On `call.live_started`: write `liveStartedAt` to `channelConfig` + KV `live:current = true`.
On `call.session_ended` / `call.ended`: write `liveEndedAt` + KV `live:current = false`.

---

## Built-in moderation features

**All built-in, no custom code required:**
- Slow mode: `channel.enableSlowMode(seconds)`
- Ban with timeout: `channel.banUser(id, { timeout: 30 })` (minutes)
- Shadow ban: `channel.banUser(id, { shadow: true })`
- Profanity blocklist: 1000+ words built-in
- Custom regex/domain/email allow/block
- Slash commands `/ban`, `/mute`, `/timeout` work out of the box (if enabled in channel type config)

---

## Gotchas

- **`@stream-io/node-sdk` may not work in Workers.** Use the manual JWT signer above + REST calls.
- **HLS playback URLs are NOT auth-protected by default.** If you support invite-only mode, you MUST use WebRTC (or proxy m3u8 through your Worker).
- **GetStream Chat throttles features above 100 concurrent watchers** (typing indicators, read receipts auto-disabled). Expected behavior, just be aware.
- **Stream key rotation drops the OBS connection mid-stream.** Always rotate when offline. Document it in the runbook.
- **Bundle size warning:** `@stream-io/video-react-sdk` + `stream-chat-react` together are 200KB+ minified. Code-split aggressively — only load on the channel page route.
- **Live viewer count drift between WebRTC and HLS paths.** Use `useCallSession().participants_count_by_role` for WebRTC. If you mix in HLS, count separately.
- **The `livestream` call type and channel type are different things.** Same name, different concepts. Don't confuse them.
