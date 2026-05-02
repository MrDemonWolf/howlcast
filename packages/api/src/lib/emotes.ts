// Emote pipeline. Pulls from Twitch, 7TV, BTTV, FFZ in parallel and merges
// into a single map written to EMOTES_KV under the key "emotes:current".
// 12h cron drives this; broadcaster can also trigger via tRPC mutation.
// All fetchers fail soft — if a provider is down or the broadcaster has no
// emotes there, that provider just contributes zero emotes to the merged map.
//
// Per DESIGN-DECISIONS.md: no R2 proxy. Emote URLs point directly at each
// provider's CDN; the browser caches them. Only metadata lives in KV.

export type EmoteProvider = "twitch" | "7tv" | "bttv" | "ffz";

export type Emote = {
	id: string;
	name: string;
	url1x: string;
	url2x: string;
	provider: EmoteProvider;
};

export type EmoteMap = {
	updatedAt: number;
	emotes: Emote[];
};

const KV_KEY = "emotes:current";
const TWITCH_TOKEN_KEY = "twitch:apptoken";

type TwitchEnv = {
	TWITCH_CLIENT_ID: string;
	TWITCH_CLIENT_SECRET: string;
	BROADCASTER_TWITCH_ID: string;
};

// ─── Twitch ───────────────────────────────────────────────────────────────

async function getTwitchAppToken(
	kv: KVNamespace,
	clientId: string,
	clientSecret: string,
): Promise<string | null> {
	if (!clientId || !clientSecret) return null;

	const cached = await kv.get<{ token: string; exp: number }>(TWITCH_TOKEN_KEY, "json");
	if (cached && cached.exp > Date.now() + 60_000) return cached.token;

	const res = await fetch("https://id.twitch.tv/oauth2/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: "client_credentials",
		}),
	});
	if (!res.ok) return null;

	const data = (await res.json()) as { access_token: string; expires_in: number };
	const exp = Date.now() + data.expires_in * 1000;
	await kv.put(TWITCH_TOKEN_KEY, JSON.stringify({ token: data.access_token, exp }), {
		expirationTtl: Math.max(60, data.expires_in - 300),
	});
	return data.access_token;
}

async function fetchTwitch(env: TwitchEnv, kv: KVNamespace): Promise<Emote[]> {
	if (!env.BROADCASTER_TWITCH_ID) return [];
	const token = await getTwitchAppToken(kv, env.TWITCH_CLIENT_ID, env.TWITCH_CLIENT_SECRET);
	if (!token) return [];

	const res = await fetch(
		`https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${env.BROADCASTER_TWITCH_ID}`,
		{
			headers: {
				"Client-Id": env.TWITCH_CLIENT_ID,
				Authorization: `Bearer ${token}`,
			},
		},
	);
	if (!res.ok) return [];

	type TwitchEmote = {
		id: string;
		name: string;
		images: { url_1x: string; url_2x: string };
	};
	const data = (await res.json()) as { data: TwitchEmote[] };
	return data.data.map((e) => ({
		id: e.id,
		name: e.name,
		url1x: e.images.url_1x,
		url2x: e.images.url_2x,
		provider: "twitch" as const,
	}));
}

// ─── 7TV ──────────────────────────────────────────────────────────────────

async function fetch7TV(twitchId: string): Promise<Emote[]> {
	if (!twitchId) return [];
	const res = await fetch(`https://7tv.io/v3/users/twitch/${twitchId}`);
	if (!res.ok) return [];

	type SevenTvEmote = { id: string; name: string };
	type SevenTvUser = { emote_set?: { emotes?: SevenTvEmote[] } };
	const data = (await res.json()) as SevenTvUser;
	return (data.emote_set?.emotes ?? []).map((e) => ({
		id: e.id,
		name: e.name,
		url1x: `https://cdn.7tv.app/emote/${e.id}/1x.webp`,
		url2x: `https://cdn.7tv.app/emote/${e.id}/2x.webp`,
		provider: "7tv" as const,
	}));
}

// ─── BTTV ─────────────────────────────────────────────────────────────────

async function fetchBTTV(twitchId: string): Promise<Emote[]> {
	if (!twitchId) return [];
	const res = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${twitchId}`);
	if (!res.ok) return [];

	type BttvEmote = { id: string; code: string };
	type BttvUser = { channelEmotes?: BttvEmote[]; sharedEmotes?: BttvEmote[] };
	const data = (await res.json()) as BttvUser;
	const all = [...(data.channelEmotes ?? []), ...(data.sharedEmotes ?? [])];
	return all.map((e) => ({
		id: e.id,
		name: e.code,
		url1x: `https://cdn.betterttv.net/emote/${e.id}/1x.webp`,
		url2x: `https://cdn.betterttv.net/emote/${e.id}/2x.webp`,
		provider: "bttv" as const,
	}));
}

// ─── FFZ ──────────────────────────────────────────────────────────────────

async function fetchFFZ(twitchId: string): Promise<Emote[]> {
	if (!twitchId) return [];
	const res = await fetch(`https://api.frankerfacez.com/v1/room/id/${twitchId}`);
	if (!res.ok) return [];

	type FfzEmote = { id: number; name: string; urls: Record<string, string> };
	type FfzSet = { emoticons: FfzEmote[] };
	type FfzRoom = { sets?: Record<string, FfzSet> };
	const data = (await res.json()) as FfzRoom;
	const out: Emote[] = [];
	for (const set of Object.values(data.sets ?? {})) {
		for (const e of set.emoticons) {
			const url1x = e.urls["1"] ?? Object.values(e.urls)[0];
			if (!url1x) continue;
			const url2x = e.urls["2"] ?? url1x;
			out.push({
				id: String(e.id),
				name: e.name,
				url1x: url1x.startsWith("//") ? `https:${url1x}` : url1x,
				url2x: url2x.startsWith("//") ? `https:${url2x}` : url2x,
				provider: "ffz",
			});
		}
	}
	return out;
}

// ─── Merge ────────────────────────────────────────────────────────────────

// Merge order matters: later providers win on name collisions. We prefer
// 7TV → BTTV → FFZ → Twitch (Twitch global emotes have lowest priority since
// they're already rendered natively by chat clients).
export async function refreshEmotes(env: TwitchEnv, kv: KVNamespace): Promise<EmoteMap> {
	const id = env.BROADCASTER_TWITCH_ID;

	const [twitch, sevenTv, bttv, ffz] = await Promise.all([
		fetchTwitch(env, kv).catch(() => [] as Emote[]),
		fetch7TV(id).catch(() => [] as Emote[]),
		fetchBTTV(id).catch(() => [] as Emote[]),
		fetchFFZ(id).catch(() => [] as Emote[]),
	]);

	const byName = new Map<string, Emote>();
	for (const e of twitch) byName.set(e.name, e);
	for (const e of ffz) byName.set(e.name, e);
	for (const e of bttv) byName.set(e.name, e);
	for (const e of sevenTv) byName.set(e.name, e);

	const map: EmoteMap = {
		updatedAt: Date.now(),
		emotes: Array.from(byName.values()),
	};
	await kv.put(KV_KEY, JSON.stringify(map));
	return map;
}

export async function readEmoteMap(kv: KVNamespace): Promise<EmoteMap | null> {
	return kv.get<EmoteMap>(KV_KEY, "json");
}
