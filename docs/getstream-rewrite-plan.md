# GetStream Frontend Rewrite — Research & Plan

> Scratchpad for the next-session deep-dive. Phase 6 work item.

## Context

Current channel page (`apps/web/src/components/channel/`) was built early in Phase 3 from a partial reading of the GetStream docs. As the dashboard's broadcaster flow has matured and we've hit real cross-domain + race-condition bugs, parts of the viewer side need a fresh pass. User feedback at end of Phase 5:

> "Lets reserach fully the full front-end and redo it with the better getstream.io docs read everything there please."

This is too big for a drop-in commit. Treat as a discrete next-session deliverable: research → diff outline → user approval → implementation.

## Files to audit

- `apps/web/src/components/channel/channel-page.tsx` — orchestrator. Player slot + chat dock + panels grid.
- `apps/web/src/components/channel/live-player.tsx` — `<StreamVideoClient>` + `<StreamCall>` + `<LivestreamPlayer>` mount.
- `apps/web/src/components/channel/live-chat.tsx` — `StreamChat.getInstance` + `connectUser` + `<Chat>` + `<Channel>` + `<MessageList>` + custom emote `renderText`.
- `apps/web/src/components/channel/emote-renderer.tsx` — rehype plugin for chat emotes.
- `apps/web/src/components/dashboard/chat/popout-chat.tsx` (and friends) — OBS browser-source chat. Same Chat SDK init.

## Known issue from current session

**"Both secret and user tokens are not set. Either client.connectUser wasn't called or client.disconnect was called"** — surfaced when broadcaster is logged in viewing the homepage. Defensive guards added, but the root cause isn't pinned yet. Hypotheses:

1. **Singleton race**: `StreamChat.getInstance(apiKey)` returns a global instance. If multiple components share it (e.g., LiveChat + popout chat), one's `disconnectUser` cleanup fires while another's `connectUser` is in flight.
2. **Token re-fetch**: `viewerToken` query refetches on focus by default. If `useEffect` deps include `token` and token re-fetch returns identical string, deps shouldn't change — but if it returns a new string, effect re-runs cleanup → connectUser races.
3. **Broadcaster identity collision**: signed-in broadcaster gets a viewer JWT (`role: "user"`) but their userId already exists on GetStream as `role: "broadcaster"`. The chat client may reject duplicate roles.
4. **Cross-domain token freshness**: cookie set on `tv.mrdemonwolf.com`, fetch goes to `api.tv.mrdemonwolf.com`. If preflight fails or cookie isn't included, token returns null → chat init with empty token.

## Research questions for the next session

For each, find the canonical answer in GetStream docs and link the URL.

1. **What's the correct mount pattern for `<LivestreamPlayer>`?** Is `dynamic(() => import(...), { ssr: false })` enough or do we need the React SDK's `<StreamTheme>` wrapper too?
2. **Should `StreamVideoClient` use `disconnectUser` on cleanup or rely on the SDK's auto-cleanup?**
3. **How does `StreamChat.getInstance` interact with React strict mode + dev hot reload?** Does the singleton prevent multiple-mount issues or cause them?
4. **What's the recommended pattern for `connectUser` across remounts?** A ref + flag, or rely on `getInstance` being idempotent?
5. **Token refresh: does `connectUser` accept a token-provider function instead of a raw string?** That would let us refresh without remount.
6. **Anonymous vs guest viewer: what's the canonical shape?** GetStream docs distinguish these — we currently bucket both as `guest-${random}`.
7. **Permission model: does the `livestream` channel type need `grants` set for viewers to receive messages?** We may have only set broadcaster grants.
8. **Backstage mode: should the call be created with `backstage: true` so RTMPS push doesn't auto-go-live?** That would make the dashboard "Go Live" button mean something distinct.
9. **Webhook events: full list.** We currently handle `call.live_started`, `call.session_started`, `call.session_ended`, `call.ended`. Are there others (e.g., `call.recording_started`, `call.broadcasting_started`) we should handle for stats / state?
10. **Viewer count: how do we read `participants_count_by_role`?** Currently we render `—` because we never wired it.

## Audit format

For each file in scope, produce:

```
file: path/to/component.tsx
  current pattern: ...
  recommended pattern (per docs): ... (link)
  diff size: trivial | medium | large
  user-facing effect: ...
```

## Sequence for the rewrite session

1. (~30 min) Fetch and index GetStream docs into context-mode (`mcp__plugin_context-mode_context-mode__ctx_fetch_and_index` with the React SDK + livestream + chat doc URLs)
2. (~30 min) Walk every relevant page in scope. Note current pattern + recommended.
3. (~15 min) Synthesize findings into `getstream-rewrite-findings.md`.
4. (~15 min) Write a numbered diff plan: which files, what changes, what each unlocks.
5. (USER) Approve / amend the plan.
6. (~2-4 hours) Implement.

## Not in scope

- Anything dashboard-side that isn't directly stream-related (Panels, Emotes, Invites, Notifications, Account, Chat-OBS-source).
- Phase 6 white-label / legal pages.
- Documentation site (Phase 7).
