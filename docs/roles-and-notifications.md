# Roles & Notifications

> **TL;DR:** Two roles (broadcaster, viewer). One permission flag (`isInvited`). Two Discord webhooks (public stream, private stream). No mods, no tiers, no subscribers.

## The model

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  BROADCASTER ──────────────────────────  VIEWER                  │
│  (you, alone)                            (everyone else)         │
│                                                                  │
│                                          ┌───────────────────┐   │
│                                          │ + isInvited flag  │   │
│                                          │   (default false) │   │
│                                          └───────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

Two roles. One bit per viewer.

## What `isInvited` controls

| Action | `isInvited = false` | `isInvited = true` |
|---|---|---|
| Watch public stream | ✅ | ✅ |
| Watch private stream | ❌ | ✅ |
| Read chat | ✅ | ✅ |
| Post in chat | ❌ | ✅ |

That's the whole rule set. The invite gates two things: **chat posting** (always) and **private-stream watching** (when broadcaster is in private mode).

**No mods.** Broadcaster handles all moderation directly via GetStream's built-in tools (slow mode, ban, timeout, blocklist).

**No subscribers.** No paid tiers, no "tier 1 / tier 2", no $3+/mo, no $8+/mo. Removed entirely per Nathanial's instruction.

## Stream visibility — broadcaster controls

Per stream, the broadcaster picks **public** or **private** before going live (toggle in dashboard).

- **Public stream:** anyone with an account watches. Anyone reads chat. Only invited viewers post.
- **Private stream:** only invited viewers can watch *or* read chat *or* post.

Visibility is a row on `channelConfig` (single-tenant: `id = 'site'`):
```ts
visibility: 'public' | 'invite_only'
```

Toggled from the dashboard's Stream page before pressing Go Live.

## Discord webhooks — broadcaster sets up two

Configured in **Dashboard → Channel → Notifications**. Two cards:

### Public webhook
- Fires when you go live with `visibility = 'public'`
- Posts to a Discord channel everyone in your server can see (e.g. `#announcements`)
- Audience: anyone in your Discord

### Private webhook
- Fires when you go live with `visibility = 'invite_only'`
- Posts to a private Discord channel restricted to invited folks (e.g. `#inner-circle-live`)
- Audience: only people Discord-permissions allow

**Both webhooks fire only the matching event.** Public stream → only public webhook fires. Private stream → only private webhook fires. Never both.

The Discord side handles *who actually sees* the message (channel permissions). HowlCast just sends to the right URL.

### Webhook payload format

```json
{
  "embeds": [{
    "title": "MrDemonWolf is live!",
    "description": "Late night chill stream — working on Wolf Run",
    "url": "https://howlcast.tv",
    "color": 1027309,
    "timestamp": "2026-05-01T22:14:08.000Z",
    "author": {
      "name": "MrDemonWolf",
      "icon_url": "https://howlcast.tv/avatar.png"
    }
  }]
}
```

When stream ends, edit the original message (Discord supports `PATCH /webhooks/{id}/messages/{message_id}`):
```json
{
  "embeds": [{
    "title": "Stream ended",
    "description": "Late night chill stream — working on Wolf Run",
    "color": 6710886,
    "footer": { "text": "Was live for 02:14:08" }
  }]
}
```

(Editing the original keeps the channel clean instead of stacking "live!" / "ended!" pairs.)

## Webhooks table — DB shape

```ts
webhooks {
  id: 'public' | 'private',     // primary key, two rows seeded on install
  url: string | null,           // null = not configured
  notifyOnLive: boolean,
  notifyOnEnd: boolean,
  lastFiredAt: Date | null,
  lastError: string | null,     // store last failure for debug visibility
  updatedAt: Date,
}
```

Two rows are seeded at first run, both with `url = null` until the broadcaster pastes a URL.

## Code outline — webhook firing

```ts
async function onStreamWentLive(env: Env) {
  const config = await db.select().from(channelConfig).where(eq(channelConfig.id, 'site')).get();
  const webhookId = config.visibility === 'public' ? 'public' : 'private';

  const webhook = await db.select().from(webhooks).where(eq(webhooks.id, webhookId)).get();
  if (!webhook?.url || !webhook.notifyOnLive) return;

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [/* see payload format above */]
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    await db.update(webhooks).set({ lastFiredAt: new Date(), lastError: null }).where(eq(webhooks.id, webhookId));
  } catch (err) {
    await db.update(webhooks).set({ lastError: err.message }).where(eq(webhooks.id, webhookId));
    // Don't throw — webhook failures shouldn't block the stream from going live.
  }
}
```

Triggered from the GetStream `call.live_started` webhook handler.

## Visibility check on viewer page-load

```ts
// app/page.tsx (root channel page)
const config = await getChannelConfig();
const session = await getSession();

if (config.visibility === 'invite_only') {
  if (!session) return redirect('/login?next=/');
  const profile = await getProfile(session.userId);
  if (!profile.isInvited) return redirect('/not-invited');
}

return <ChannelPage config={config} />;
```

For the chat post permission: GetStream's role-based grants enforce this. Set the chat user's role to `viewer` or `invited_viewer` based on `profile.isInvited` when minting the chat token.

## Inviting a viewer — broadcaster flow

In **Dashboard → Channel → Invite emails**:

1. Broadcaster fills out: email, optional message, expiration (default 7 days)
2. System creates an `invites` row with a unique `code`
3. Email is sent via Resend using the "Private stream invite" template (single template — no other templates exist)
4. Recipient clicks the magic link → redirected to `/invite/{code}` → asked to log in or sign up → on accept, `profiles.isInvited = true` is set + `invites.usedBy/usedAt` recorded

No tier picker. No role picker. Accepting an invite means `isInvited = true`. That's it.

## Removed (in case you want a paper trail)

- ❌ `mod_assignments` table
- ❌ `mod` role from the role enum
- ❌ `tier` field on profiles
- ❌ `tierGrantedAt` field
- ❌ Inner Circle vs Public tier distinction
- ❌ Subscriber tiers (`$3+/mo`, `$8+/mo`)
- ❌ Subscribe button
- ❌ Mod queue / Mod sidebar / Mod chat badge
- ❌ Per-event notification grid (Ko-fi tip, raid, sub thank-you, etc.)
- ❌ Multi-channel notification fanout (Email/RSS/Web push)
- ❌ Throttling / quiet hours config

If any of these come back, it's a v2 conversation, not a v1 patch.
