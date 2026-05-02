# Emote Pipeline

> **TL;DR:** Cron fetches metadata (name → CDN URL) from 7TV/BTTV/FFZ/Twitch every 12 hours, merges with priority order, stores in KV. Images load directly from provider CDNs (no R2 proxy — browsers cache them). Broadcaster has a "Refresh now" button on the dashboard. Word-level matching in chat via rehype plugin.

## Single-input setup

The broadcaster's **Twitch user ID** is the only input HowlCast needs. All four providers (Twitch, 7TV, BTTV, FFZ) key off Twitch user ID. As long as the broadcaster has signed up at each provider's site once and linked their Twitch account, our API queries return their emotes automatically.

The same Twitch ID also seeds broadcaster profile defaults (display name, bio, avatar) on first-run setup — see `docs/architecture.md`.

## What you'll find here

1. Provider quick reference
2. Caching strategy
3. The cron handler
4. Priority/merge logic
5. R2 image proxy
6. Performance rules

---

## Provider quick reference

| | 7TV | BTTV | FFZ | Twitch |
|---|---|---|---|---|
| API base | `7tv.io/v3` | `api.betterttv.net/3` | `api.frankerfacez.com/v1` | `api.twitch.tv/helix` |
| Channel endpoint | `/users/twitch/{id}` | `/cached/users/twitch/{id}` | `/room/id/{id}` | `/chat/emotes?broadcaster_id={id}` |
| Global endpoint | `/emote-sets/global` | `/cached/emotes/global` | `/set/global` | `/chat/emotes/global` |
| Auth | None | None | None | **App access token** (client_credentials) |
| CDN | `cdn.7tv.app/emote/{id}/{1-4}x.webp` | `cdn.betterttv.net/emote/{id}/{1-3}x` | `cdn.frankerfacez.com/emoticon/{id}/{1,2,4}` | `static-cdn.jtvnw.net/emoticons/v2/{id}/{format}/{theme}/{1.0-3.0}` |
| Rate limit | none documented | none documented | none documented | 800 pts/min/app |
| Animated | webp/avif/gif | gif/webp via `imageType` | webp under `animated` key | `format=animated` |

**Twitch auth note:** Both Get Channel Emotes and Get Global Emotes accept an **app access token (client_credentials grant)**. You do NOT need broadcaster OAuth. Cache the app token in KV with TTL just under `expires_in - 300` seconds.

---

## Caching strategy

| What | Where | TTL | Why |
|---|---|---|---|
| Emote metadata (merged map) | KV `emotes:channel:{twitchId}` | 12h | Read on every chat connect |
| Twitch app token | KV `twitch:app_token` | `expires_in - 300` | Refresh before expiration |
| Emote images | **Browser HTTP cache (provider CDNs)** | provider-controlled | All four CDNs are global + immutable per emote ID |

**No R2 proxy.** Provider CDNs (`cdn.7tv.app`, `cdn.frankerfacez.com`, `cdn.betterttv.net`, `static-cdn.jtvnw.net`) are fast and cache aggressively. Browser caches the image bytes per HTTP headers. Round-tripping through our Worker buys nothing for a single-broadcaster install.

CSP must whitelist the four CDN hosts in `next.config.ts` — that's the only cost.

**Refresh triggers:**
1. Cron in `apps/server/src/scheduled.ts` every 12 hours.
2. Broadcaster-initiated "Refresh emotes now" button on Dashboard → Channel → Emotes (calls a tRPC mutation that re-runs the fetcher pipeline).

---

## Twitch app token helper

```ts
// apps/server/src/lib/emotes/twitch.ts
export async function getTwitchAppToken(env: Env): Promise<string> {
  const cached = await env.KV.get("twitch:app_token");
  if (cached) {
    const { token, exp } = JSON.parse(cached);
    if (Date.now() / 1000 < exp - 60) return token;
  }

  const r = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID,
      client_secret: env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  if (!r.ok) throw new Error(`Twitch token ${r.status}`);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  const exp = Math.floor(Date.now() / 1000) + j.expires_in;

  await env.KV.put(
    "twitch:app_token",
    JSON.stringify({ token: j.access_token, exp }),
    { expirationTtl: Math.max(j.expires_in - 300, 300) }
  );
  return j.access_token;
}
```

---

## Per-provider fetchers (sketch)

```ts
// apps/server/src/lib/emotes/seventv.ts
export async function fetch7TVChannel(twitchId: string): Promise<EmoteRecord[]> {
  const r = await fetch(`https://7tv.io/v3/users/twitch/${twitchId}`);
  if (!r.ok) return [];
  const data = await r.json() as any;
  const emotes = data.emote_set?.emotes ?? [];
  return emotes.map((e: any) => ({
    id: e.id,
    name: e.name,
    provider: "7tv" as const,
    scope: "channel" as const,
    url1x: `https://cdn.7tv.app/emote/${e.id}/1x.webp`,
    url2x: `https://cdn.7tv.app/emote/${e.id}/2x.webp`,
    url3x: `https://cdn.7tv.app/emote/${e.id}/3x.webp`,
    url4x: `https://cdn.7tv.app/emote/${e.id}/4x.webp`,
    animated: e.data?.animated ?? false,
  }));
}

// Similar shape for BTTV, FFZ, Twitch (Helix)
```

---

## Cron handler

```ts
// apps/server/src/scheduled.ts
export default {
  fetch: app.fetch,
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    if (controller.cron === "*/15 * * * *") {
      ctx.waitUntil(refreshEmoteSet(env, env.BROADCASTER_TWITCH_ID));
    }
  },
};

async function refreshEmoteSet(env: Env, twitchId: string) {
  const [
    sevenTvCh, sevenTvGl,
    bttvCh, bttvGl,
    ffzCh, ffzGl,
    twitchSub, twitchGl,
  ] = await Promise.all([
    fetch7TVChannel(twitchId),
    fetch7TVGlobal(),
    fetchBTTVChannel(twitchId),
    fetchBTTVGlobal(),
    fetchFFZChannel(twitchId),
    fetchFFZGlobal(),
    fetchTwitchChannel(twitchId, env),
    fetchTwitchGlobal(env),
  ]);

  // Build merged map with priority (later writes win)
  const order: [string, EmoteRecord[]][] = [
    ["twitch_global", twitchGl],
    ["ffz_global", ffzGl],
    ["bttv_global", bttvGl],
    ["7tv_global", sevenTvGl],
    ["twitch_channel", twitchSub],
    ["ffz_channel", ffzCh],
    ["bttv_channel", bttvCh],
    ["7tv_channel", sevenTvCh],
  ];

  const map: Record<string, EmoteRecord> = {};
  for (const [_, list] of order) {
    for (const e of list) map[e.name] = e;
  }

  await env.KV.put(
    `emotes:channel:${twitchId}`,
    JSON.stringify(map),
    { expirationTtl: 86400 }
  );
}
```

**Priority order (default):**
```
7TV channel > BTTV channel > FFZ channel > Twitch sub
> 7TV global > BTTV global > FFZ global > Twitch global
```

Build the map in **reverse** so higher priority overwrites.

---

## R2 image proxy

```ts
// apps/server/src/routers/emote-proxy.ts (or as a Hono route)
app.get("/api/emote-proxy/:provider/:id/:size", async (c) => {
  const { provider, id, size } = c.req.param();
  const cacheKey = `${provider}/${id}/${size}`;

  // 1. Try Cloudflare edge cache
  const cache = caches.default;
  const cached = await cache.match(c.req.raw);
  if (cached) return cached;

  // 2. Try R2
  const obj = await c.env.EMOTES_R2.get(cacheKey);
  if (obj) {
    const res = new Response(obj.body, {
      headers: {
        "Content-Type": obj.httpMetadata?.contentType ?? "image/webp",
        "Cache-Control": "public, max-age=2592000, immutable",
      },
    });
    c.executionCtx.waitUntil(cache.put(c.req.raw, res.clone()));
    return res;
  }

  // 3. Fetch from origin CDN
  const originUrl = buildOriginUrl(provider, id, size);
  if (!originUrl) return c.text("not found", 404);

  const r = await fetch(originUrl);
  if (!r.ok) return c.text("origin error", r.status);

  const body = await r.arrayBuffer();
  const contentType = r.headers.get("Content-Type") ?? "image/webp";

  // Write to R2 (don't await, just send response fast)
  c.executionCtx.waitUntil(
    c.env.EMOTES_R2.put(cacheKey, body, {
      httpMetadata: { contentType },
    })
  );

  const res = new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=2592000, immutable",
    },
  });
  c.executionCtx.waitUntil(cache.put(c.req.raw, res.clone()));
  return res;
});

function buildOriginUrl(provider: string, id: string, size: string) {
  switch (provider) {
    case "7tv":    return `https://cdn.7tv.app/emote/${id}/${size}.webp`;
    case "bttv":   return `https://cdn.betterttv.net/emote/${id}/${size}`;
    case "ffz":    return `https://cdn.frankerfacez.com/emoticon/${id}/${size}`;
    case "twitch": return `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/${size}`;
    default:       return null;
  }
}
```

---

## Performance rules

1. **Virtualize the chat list** with `@tanstack/react-virtual` or `<VirtualizedMessageList>`. Biggest single win.
2. **Pre-tokenize messages on receive** — store `Token[]` on the message object.
3. **`loading="lazy" decoding="async"`** on every emote `<img>`.
4. **Memoize `EmoteWithTooltip`** by `emote.id + size`.
5. **Preload the channel's hot 50 emotes** via `<link rel="preload" as="image">` on chat connect.
6. **Don't build sprite sheets.** Animated WEBP + lazy load is faster and simpler.

---

## Inline emote component (sketch)

```tsx
// apps/web/src/components/emote/Emote.tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export function Emote({ emote }: { emote: EmoteRecord }) {
  const proxyUrl = (size: string) =>
    `/api/emote-proxy/${emote.provider}/${emote.id}/${size}`;

  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger asChild>
        <img
          src={proxyUrl("1x")}
          srcSet={`${proxyUrl("1x")} 1x, ${proxyUrl("2x")} 2x`}
          alt={emote.name}
          loading="lazy"
          decoding="async"
          className="inline-block h-7 align-middle mx-0.5"
        />
      </HoverCardTrigger>
      <HoverCardContent className="w-auto p-3">
        <div className="flex flex-col items-center gap-2">
          <img
            src={proxyUrl("3x")}
            alt={emote.name}
            className="h-24 w-auto"
          />
          <div className="text-center">
            <div className="font-semibold">{emote.name}</div>
            <div className="text-xs text-muted-foreground">
              {emote.provider.toUpperCase()} · {emote.scope}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
```

---

## Gotchas

- **Twitch app token is sufficient for both global AND channel emotes.** Don't over-engineer broadcaster OAuth.
- **None of the providers document hard rate limits except Twitch (800 pts/min/app).** Cron at 15-min intervals is well under that.
- **7TV uses `connection_id`, not Twitch ID, in some endpoints.** Verify which field your fetcher needs.
- **BTTV channel emotes return shared + channel emotes separately.** Merge them into one list at fetch time.
- **FFZ has separate global sets.** Iterate `default_sets` then merge.
- **Twitch animated emotes need `format=animated`** in the URL — otherwise you get the static fallback.
- **Cron triggers don't auto-fire in `wrangler dev`.** Use `--test-scheduled` and the `/__scheduled?cron=...` URL for local testing.
