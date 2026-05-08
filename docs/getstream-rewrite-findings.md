# GetStream Frontend Rewrite — Audit Findings

> Round 1: 2026-05-06 — found 4 P1/P2 issues, all shipped (commit `c1a9003`).
> **Round 2: 2026-05-07** — re-audit against full Video + Chat docs. New findings below.

---

## Round 1 — historical (closed)

The first audit shipped in `c1a9003`:

| File                                               | Change                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------- |
| `packages/api/src/routers/stream.ts`               | `getViewerToken` emits correct role + `isGuest` flag                   |
| `apps/web/src/components/channel/live-player.tsx`  | `useState+useEffect` for client, `call.join()`, viewer count via hooks |
| `apps/web/src/components/channel/live-chat.tsx`    | `setState(null)` disconnect ordering, `allowedTagNames` includes `img` |
| `apps/web/src/components/channel/channel-page.tsx` | `canPost` uses `isGuest` flag                                          |

These are all verified present in the current source. Full round-1 detail preserved in commit message + git history.

---

## Round 2 — open findings (re-audit, this is the diff plan)

### SDK pin currency

| Package                      | Pin       | Notes                                                                         |
| ---------------------------- | --------- | ----------------------------------------------------------------------------- |
| `@stream-io/video-react-sdk` | `^1.36.0` | Stable. No breaking moves.                                                    |
| `stream-chat`                | `^9.43.0` | `connectAnonymousUser` + `setGuestUser` both present.                         |
| `stream-chat-react`          | `^14.0.1` | `useCreateChatClient` is the canonical mount hook (v11+). We're not using it. |

No upgrade required. Pattern fixes only.

---

### 2.1 `live-player.tsx` — drop `<StreamCall>` + manual `join()`

**Current**

```tsx
const c = client.call("livestream", callId);
c.join();
return (
	<StreamVideo client={client}>
		<StreamCall call={c}>
			<LivestreamView /* uses useParticipantCount */ />
		</StreamCall>
	</StreamVideo>
);
```

**Canonical** ([livestream tutorial](https://getstream.io/video/docs/react/tutorials/livestream/))

```tsx
return (
	<StreamVideo client={client}>
		<LivestreamPlayer callType="livestream" callId={callId} />
	</StreamVideo>
);
```

`<LivestreamPlayer>` is a self-contained component. It internally creates the call, joins it, and tears down on unmount. Wrapping it in `<StreamCall>` and calling `client.call().join()` ourselves means:

- Two call objects exist (the one we created, the one the player creates).
- Cleanup ordering between our `c.leave()` and the player's internal teardown is racy in Strict Mode.

**Open question** before implementing: where does `useParticipantCount` resolve when there's no explicit `<StreamCall>`? Two options:

- (A) Drop the inner `<StreamCall>`, query `client.state.calls` reactively for the count.
- (B) Keep `<StreamCall>` but drop the manual `c.join()` — let LivestreamPlayer be the join authority. This keeps the hook context intact with one fewer race.

**Recommendation:** Option B — minimal diff, preserves the viewer count UX.

**Diff size:** small
**User-facing effect:** lower mount-race risk, especially in dev Strict Mode and on focus-driven re-renders.

---

### 2.2 `live-player.tsx` + `stream.ts` — anonymous tokens need `call_cids`

**Current:** `signStreamUserToken` emits `{ user_id, role, iat, exp }`. For `role: "anonymous"`, this is incomplete.

**Canonical** ([Client & Authentication § Anonymous users](https://getstream.io/video/docs/react/guides/client-auth/#anonymous-users)) — anonymous Video tokens MUST include `call_cids`:

```json
{
	"iss": "@stream-io/dashboard",
	"user_id": "!anon",
	"role": "viewer",
	"call_cids": ["livestream:<callId>"]
}
```

Without this claim, anon viewers can't open a WebSocket against the call. Also the user shape on the client should be `{ type: "anonymous" }` — not `{ id: "guest-<uuid>" }`.

**Files:**

- [packages/api/src/lib/stream.ts](../packages/api/src/lib/stream.ts) — extend signer to accept optional `call_cids: string[]`.
- [packages/api/src/routers/stream.ts:75-107](../packages/api/src/routers/stream.ts) — `getViewerToken`: when `isGuest`, look up `cfg.streamCallId` and pass `call_cids: [\`livestream:\${cfg.streamCallId}\`]`. Also return a flag so the frontend knows to use `{ type: "anonymous" }`.
- [apps/web/src/components/channel/live-player.tsx](../apps/web/src/components/channel/live-player.tsx) — when guest, pass `user: { type: "anonymous" }` to `StreamVideoClient`.

**Diff size:** medium
**User-facing effect:** anonymous viewers actually connect to the live stream WebSocket once `STREAM_API_KEY/SECRET` are exercised in real prod traffic. Today they may silently fail.

---

### 2.3 `live-chat.tsx` — switch to `useCreateChatClient`

**Current:** `StreamChat.getInstance(apiKey)` (process-global singleton) + manual `connectUser` / `disconnectUser` with a `cancelled` flag and "null state then disconnect" cleanup ordering.

**Canonical** ([Getting Started](https://getstream.io/chat/docs/sdk/react/basics/getting_started/)):

```tsx
import { useCreateChatClient } from "stream-chat-react";

const client = useCreateChatClient({
	apiKey,
	tokenOrProvider: token, // string OR async () => string
	userData: { id: userId },
});

if (!client) return <div>Loading…</div>;
return <Chat client={client}>...</Chat>;
```

The hook owns the connect / disconnect lifecycle and returns `null` until the WebSocket is up — no `cancelled` flag, no manual disconnect, no singleton.

**Why this matters here, beyond cleanliness:** the singleton is shared between `channel-page` (LiveChat) and `dashboard-chat.tsx` (LiveChat in OBS popout). If a broadcaster has both surfaces open in different tabs, `connectUser` from one tab disconnects the other. Per-component instances kill the conflict.

**Diff size:** medium
**User-facing effect:** broadcaster can keep `/dashboard/chat` open in tab 1 and `/` in tab 2 without the chat dropping on either side.

---

### 2.4 `live-chat.tsx` — anonymous viewers should `connectAnonymousUser`

**Current:** anonymous viewers receive a server-signed JWT and call regular `connectUser`. This consumes a chat user slot per viewer.

**Canonical** ([Authless Users § Anonymous Users](https://getstream.io/chat/docs/react/authless_users/)):

```tsx
await client.connectAnonymousUser();
```

> Anonymous users are not counted toward your MAU number and only have an impact on the number of concurrent connected clients.

For the `livestream` channel type, anonymous read works by default — exactly what we want for the public landing surface.

**Implementation:** `useCreateChatClient` doesn't take an "anonymous" flag directly. Two paths:

- (A) Build a small `useAnonymousChatClient` hook that mirrors `useCreateChatClient` but calls `connectAnonymousUser` instead of `connectUser`.
- (B) Branch in `LiveChat`: render one of two inner subcomponents based on `props.token` being null/undefined. Each subcomponent uses its own hook variant.

**Recommendation:** Option B — explicit branch keeps lifecycle simple.

**Diff size:** medium
**User-facing effect:** anonymous viewers stop counting against MAU. This is a billing fix that becomes material as traffic grows.

---

### 2.5 `channel-page.tsx` — stop refetch on focus for token queries

**Current:** `viewerToken` and `getStreamCredentials` queries set `retry: false` only. React-Query default `refetchOnWindowFocus: true` applies → each tab focus may return a fresh token reference → SDK clients see new prop → useEffect re-runs → `disconnectUser` then `connectUser` race.

**Fix:**

```ts
useQuery({
	...trpc.stream.getViewerToken.queryOptions(),
	retry: false,
	refetchOnWindowFocus: false,
	staleTime: Infinity, // until the JWT actually expires
});
```

Long-term goal is a `tokenProvider` function passed to the SDK so refresh happens at token-expiry boundaries, not at react-query refetch boundaries — but that's a follow-up after the lifecycle rewrite settles.

**Diff size:** trivial
**User-facing effect:** stops the tab-focus reconnect storm.

---

### 2.6 `live-chat.tsx` props — make `token`/`userId` optional for anon path

After 2.4, the anon branch doesn't need `token` or `userId`. Update prop type:

```ts
type Props =
	| { kind: "anonymous"; apiKey: string; channelCid: string; canPost: false }
	| {
			kind: "user";
			apiKey: string;
			userId: string;
			token: string;
			channelCid: string;
			canPost: boolean;
	  };
```

…or simpler: keep `userId`/`token` as optional and branch internally on their presence.

**Callers updated:**

- `channel-page.tsx` — pass anon shape when `viewerToken.data?.isGuest`.
- `dashboard/chat/dashboard-chat.tsx` — always passes `kind: "user"` (broadcaster).

**Diff size:** trivial
**User-facing effect:** none directly; supports 2.4.

---

### 2.7 (verification only) `livestream` channel-type permission grants

[User Permissions § Channel-Type Permissions](https://getstream.io/chat/docs/react/channel_permission_policies/) — built-in `livestream` type grants `anonymous` role `read-channel` by default. We never override this. Verification step before shipping 2.4: confirm in the GetStream dashboard that the channel-type permission matrix has not been edited.

**Diff size:** none (verification step)

---

## 3. Out of scope

- Panels grid, emotes pipeline backend, mailer, invites, dashboard streaming UI surface.
- Phase 6 white-label / legal pages.
- Astro Starlight docs site (Phase 7).
- Recording / VOD (explicit product no per `CLAUDE.md`).
- **Backstage mode** ([Joining § Backstage setup](https://getstream.io/video/docs/react/guides/joining-and-creating-calls/#backstage-setup)) — would change operator UX. Defer to a separate decision in `docs/decisions.md`.
- **Webhook events catalogue refresh** — the canonical webhooks doc URL 404s; existing handler covers the events we care about. Revisit when stats grow.

---

## 4. Numbered diff plan (this is the approval gate)

Order is by safe-to-ship dependency, not impact:

1. [`packages/api/src/lib/stream.ts`](../packages/api/src/lib/stream.ts) — extend `signStreamUserToken` with optional `call_cids`. _Reason:_ §2.2.
2. [`packages/api/src/routers/stream.ts`](../packages/api/src/routers/stream.ts) — `getViewerToken` populates `call_cids` for guests. _Reason:_ §2.2.
3. [`apps/web/src/components/channel/live-player.tsx`](../apps/web/src/components/channel/live-player.tsx) — drop manual `c.join()`; pass `user: { type: "anonymous" }` for guests. Keep inner `<StreamCall>` for hook context (Option B in §2.1). _Reason:_ §2.1, §2.2.
4. [`apps/web/src/components/channel/live-chat.tsx`](../apps/web/src/components/channel/live-chat.tsx) — replace singleton+manual lifecycle with `useCreateChatClient`. Add anon branch using `connectAnonymousUser`. _Reason:_ §2.3, §2.4.
5. [`apps/web/src/components/channel/channel-page.tsx`](../apps/web/src/components/channel/channel-page.tsx) — query options `staleTime: Infinity`, `refetchOnWindowFocus: false`. Update LiveChat caller for new prop shape. _Reason:_ §2.5, §2.6.
6. [`apps/web/src/components/dashboard/chat/dashboard-chat.tsx`](../apps/web/src/components/dashboard/chat/dashboard-chat.tsx) — update LiveChat caller for new prop shape. _Reason:_ §2.6.
7. **(verify)** GetStream dashboard → `livestream` channel type permissions matrix unchanged. _Reason:_ §2.7.

Estimated implementation time: 2–3 hours including `bun run check-types` + manual e2e.

---

## 5. Verification plan post-implementation

1. `bun run check-types` clean.
2. Anon viewer (incognito) loads `/` while live → sees player + read-only chat. No console errors.
3. Invited viewer signs in → composer appears, can post.
4. Broadcaster signs in → no "tokens not set" error class.
5. Broadcaster opens `/dashboard/chat` in 2nd tab → both surfaces stay connected.
6. Tab away from `/` 30s, tab back → no new WS handshake in DevTools Network panel.
7. `call.live_started` webhook still flips `liveStartedAt`; Discord webhooks still fan out.
