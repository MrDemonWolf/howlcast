// Twitch Helix lookups + emote-provider probing for the setup wizard.
// App credentials live in env (server config); user-facing data resolves
// at runtime from the username they type. Same client_credentials grant
// flow as the emote pipeline — token cached in KV.

const TWITCH_TOKEN_KEY = "twitch:apptoken";

export type TwitchAppCreds = {
	clientId: string;
	clientSecret: string;
};

export class TwitchNotConfiguredError extends Error {
	constructor() {
		super("Twitch not configured. Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET.");
		this.name = "TwitchNotConfiguredError";
	}
}

// Cached app token lookup. Returns null on transport failure so callers can
// fail-soft (matches the emote pipeline's behaviour).
export async function getTwitchAppToken(
	kv: KVNamespace,
	creds: TwitchAppCreds,
): Promise<string | null> {
	if (!creds.clientId || !creds.clientSecret) return null;

	const cached = await kv.get<{ token: string; exp: number }>(TWITCH_TOKEN_KEY, "json");
	if (cached && cached.exp > Date.now() + 60_000) return cached.token;

	const res = await fetch("https://id.twitch.tv/oauth2/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: creds.clientId,
			client_secret: creds.clientSecret,
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

export type TwitchUser = {
	id: string;
	login: string;
	displayName: string;
	profileImageUrl: string | null;
	description: string | null;
};

// Helix users lookup by login (username). Returns null when the user
// doesn't exist; throws TwitchNotConfiguredError when keys are empty.
export async function lookupTwitchUser(
	login: string,
	kv: KVNamespace,
	creds: TwitchAppCreds,
): Promise<TwitchUser | null> {
	if (!creds.clientId || !creds.clientSecret) throw new TwitchNotConfiguredError();
	const token = await getTwitchAppToken(kv, creds);
	if (!token) return null;

	const url = `https://api.twitch.tv/helix/users?login=${encodeURIComponent(login.trim().toLowerCase())}`;
	const res = await fetch(url, {
		headers: { "Client-Id": creds.clientId, Authorization: `Bearer ${token}` },
	});
	if (!res.ok) return null;

	type HelixUser = {
		id: string;
		login: string;
		display_name: string;
		profile_image_url: string;
		description: string;
	};
	const data = (await res.json()) as { data: HelixUser[] };
	const u = data.data[0];
	if (!u) return null;
	return {
		id: u.id,
		login: u.login,
		displayName: u.display_name,
		profileImageUrl: u.profile_image_url || null,
		description: u.description || null,
	};
}

export type ProviderProbe = {
	sevenTv: { claimed: boolean; count: number };
	bttv: { count: number };
	ffz: { count: number };
};

// Parallel probe across 7TV / BTTV / FFZ. The wizard renders a recap card
// from this; the emote pipeline does its own deeper fetch on the cron tick.
export async function probeEmoteProviders(twitchId: string): Promise<ProviderProbe> {
	const [sevenTv, bttv, ffz] = await Promise.all([
		probe7TV(twitchId).catch(() => ({ claimed: false, count: 0 })),
		probeBTTV(twitchId).catch(() => ({ count: 0 })),
		probeFFZ(twitchId).catch(() => ({ count: 0 })),
	]);
	return { sevenTv, bttv, ffz };
}

async function probe7TV(twitchId: string) {
	const res = await fetch(`https://7tv.io/v3/users/twitch/${twitchId}`);
	if (!res.ok) return { claimed: false, count: 0 };
	type SevenTvUser = { emote_set?: { emotes?: unknown[] } };
	const data = (await res.json()) as SevenTvUser;
	return { claimed: true, count: data.emote_set?.emotes?.length ?? 0 };
}

async function probeBTTV(twitchId: string) {
	const res = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${twitchId}`);
	if (!res.ok) return { count: 0 };
	type BttvUser = { channelEmotes?: unknown[]; sharedEmotes?: unknown[] };
	const data = (await res.json()) as BttvUser;
	return {
		count: (data.channelEmotes?.length ?? 0) + (data.sharedEmotes?.length ?? 0),
	};
}

async function probeFFZ(twitchId: string) {
	const res = await fetch(`https://api.frankerfacez.com/v1/room/id/${twitchId}`);
	if (!res.ok) return { count: 0 };
	type FfzSet = { emoticons?: unknown[] };
	type FfzRoom = { sets?: Record<string, FfzSet> };
	const data = (await res.json()) as FfzRoom;
	let total = 0;
	for (const set of Object.values(data.sets ?? {})) total += set.emoticons?.length ?? 0;
	return { count: total };
}
