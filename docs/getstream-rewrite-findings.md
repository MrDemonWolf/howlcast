# GetStream Frontend Rewrite — Audit Findings

> Produced: 2026-05-06. Full audit of `live-player.tsx`, `live-chat.tsx`, and `channel-page.tsx` against current GetStream React Video SDK and Chat SDK docs.

---

## FILE: `apps/web/src/components/channel/live-player.tsx`

### [P1-CRITICAL] No `call.join()` — viewer never connects to stream

```
current:  const call = useMemo(() => client.call("livestream", callId), [client, callId]);
          // call is created but join() is never called

canonical: useEffect(() => {
             const c = client.call("livestream", callId);
             setCall(c);
             c.join().catch(console.error);
             return () => { c.leave().catch(console.error); };
           }, [client, callId]);
```

- Source: https://getstream.io/video/docs/react/tutorials/livestream
- Diff size: medium
- User-facing: Player renders but never receives the stream. `LivestreamPlayer` relies on call state from `join()`.

### [P1-CRITICAL] `useMemo` for StreamVideoClient — no cleanup, leaks WebSocket

```
current:  const client = useMemo(() => new StreamVideoClient(...), [...]);

canonical: const [client, setClient] = useState<StreamVideoClient>();
           useEffect(() => {
             const c = new StreamVideoClient({ apiKey, user: { id: userId }, token });
             setClient(c);
             return () => { c.disconnectUser(); setClient(undefined); };
           }, [apiKey, userId, token]);
```

- Source: https://getstream.io/video/docs/react/guides/client-auth/
- Diff size: medium
- User-facing: Old WebSocket never closed on unmount. Stacked connections in dev (React Strict Mode double-invokes). Token changes create new client without disconnecting old one.

### [P2] Viewer count hardcoded `—`

```
current:  <span className="font-mono">—</span>

canonical: const { useParticipantCount } = useCallStateHooks();
           const count = useParticipantCount();
           // must render inside <StreamCall> context
```

- Source: https://getstream.io/video/docs/react/tutorials/livestream
- Diff size: trivial
- User-facing: Live viewer count always shows `—`.

### [P3] Static token — no auto-refresh

- Current token string is fetched once; expires after 1h TTL → player silently fails for long sessions.
- Fix: pass `tokenProvider` async function to `StreamVideoClient` instead of static `token`.
- Diff size: medium. Deferred to follow-up.

---

## FILE: `apps/web/src/components/channel/live-chat.tsx`

### [P1-CRITICAL] Race condition on disconnect → "Both secret and user tokens are not set"

```
current cleanup: cancelled = true; client.disconnectUser().catch(()=>{})
                 // setReady never flipped false; <Chat> still renders during disconnect

canonical:       setChatClient(null);      // unmount <Chat> FIRST
                 client.disconnectUser();  // then disconnect safely
```

- Source: https://github.com/GetStream/stream-chat-react/issues/1487
- Diff size: small
- User-facing: Root cause of the "Both secret and user tokens are not set" error the broadcaster sees on the homepage. Triggered by React Strict Mode double-mount, token re-fetch, or navigation.

### [P2] `allowedTagNames` missing `img` — emotes stripped by sanitizer

```
current:  renderText(text, mentioned, {
            getRehypePlugins: (defaults) => [...],
          })

canonical: renderText(text, mentioned, {
            allowedTagNames: [...defaultAllowedTagNames, "img"],
            getRehypePlugins: (defaults) => [...],
          })
```

- Diff size: trivial
- User-facing: Custom emotes (`FeelsGoodMan`, etc.) silently stripped. Users type emote name, nothing renders.

### [P2] Broadcaster gets `role:"user"` JWT → chat role collision

```
current:  getViewerToken always emits role:"user" for any signed-in user
          broadcaster's GetStream identity was registered as role:"broadcaster"
          SDK rejects the downgrade → chat init fails for broadcaster on /

fix:      in getViewerToken, check profile.role from DB
          emit role:"broadcaster" if broadcaster, else role:"user"
```

- Source: `packages/api/src/routers/stream.ts:76-86`
- Diff size: small
- User-facing: Broadcaster viewing the channel page gets chat error. Hypothesis #3 from original rewrite plan — confirmed.

### [P3] Guest UUID regenerated every page load

- `guest-${crypto.randomUUID()}` creates a new GetStream user record on every anonymous load.
- Fix: use `connectAnonymousUser()` (no MAU impact) or persist guest ID in localStorage.
- Deferred — low blast radius now, important before public launch.

### [P3] `canPost` check is a fragile string prefix

```
current:  canPost: !viewerToken.data!.userId.startsWith("guest-")
fix:      add isGuest: boolean to getViewerToken return shape
```

- Diff size: trivial
- User-facing: None currently; future usernames starting with "guest-" would be locked out.

---

## Changes Made (this session)

| File                                               | Change                                                       |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `packages/api/src/routers/stream.ts`               | `getViewerToken` emits correct role + `isGuest` flag         |
| `apps/web/src/components/channel/live-player.tsx`  | `useState+useEffect` for client, `call.join()`, viewer count |
| `apps/web/src/components/channel/live-chat.tsx`    | `setState(null)` disconnect fix, `allowedTagNames` img       |
| `apps/web/src/components/channel/channel-page.tsx` | `canPost` uses `isGuest`                                     |
