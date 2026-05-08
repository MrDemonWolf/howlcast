import alchemy from "alchemy";
import { D1Database, KVNamespace, Nextjs, R2Bucket, Worker } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });
config({ path: "../../apps/server/.env" });

// Local dev: file-based state store (default). CI: CloudflareStateStore so
// deploys from GitHub Actions don't trip Alchemy's "no local state in CI"
// guardrail. Backed by a Worker + Durable Object that Alchemy provisions
// itself; needs ALCHEMY_STATE_TOKEN as a GH Actions secret (any value, just
// has to match across deploys on this Cloudflare account).
const app = await alchemy("howlcast", {
	stateStore: process.env.CI ? (scope) => new CloudflareStateStore(scope) : undefined,
});

// adopt: true claims an existing Cloudflare resource into Alchemy's state
// instead of failing with a "already exists" error. Needed because the
// state store was migrated from local files to CloudflareStateStore — the
// new store has no record of resources that earlier local deploys made.
const db = await D1Database("database", {
	name: "howlcast-db",
	migrationsDir: "../../packages/db/src/migrations",
	adopt: true,
});

const publicBucket = await R2Bucket("public", {
	name: "howlcast-public",
	adopt: true,
});

const isrBucket = await R2Bucket("isr", {
	name: "howlcast-isr",
	adopt: true,
});

const emotesKv = await KVNamespace("emotes", {
	title: "HOWLCAST_EMOTES",
	adopt: true,
});

export const server = await Worker("server", {
	name: "tv-api",
	cwd: "../../apps/server",
	entrypoint: "src/index.ts",
	compatibility: "node",
	adopt: true,
	// Custom domain — sibling subdomain of tv.mrdemonwolf.com so cookies
	// can be set with Domain=.tv.mrdemonwolf.com and shared across both
	// (web on tv, api on api.tv). Workers.dev URLs stay as fallback.
	domains: [{ domainName: "api.tv.mrdemonwolf.com", adopt: true }],
	bindings: {
		DB: db,
		PUBLIC_BUCKET: publicBucket,
		EMOTES_KV: emotesKv,
		CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
		BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
		BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL!,
		// Mail transport — Resend (prod) > SMTP (dev mailpit) > console fallback.
		RESEND_API_KEY: alchemy.secret(process.env.RESEND_API_KEY ?? ""),
		SMTP_URL: process.env.SMTP_URL ?? "",
		MAIL_FROM: process.env.MAIL_FROM ?? "HowlCast <invites@mail.howlcast.tv>",
		// GetStream — sign user/admin JWTs for video + chat, also verify the
		// Video webhook signature (signed with the same API Secret).
		// Empty string means "not configured" — procedures throw a clear error.
		STREAM_API_KEY: alchemy.secret(process.env.STREAM_API_KEY ?? ""),
		STREAM_API_SECRET: alchemy.secret(process.env.STREAM_API_SECRET ?? ""),
		// Twitch — app credentials for the emote pipeline + setup wizard
		// Helix lookups. The broadcaster's Twitch id lives in the DB
		// (channelConfig.broadcasterTwitchId), set by the setup wizard.
		TWITCH_CLIENT_ID: alchemy.secret(process.env.TWITCH_CLIENT_ID ?? ""),
		TWITCH_CLIENT_SECRET: alchemy.secret(process.env.TWITCH_CLIENT_SECRET ?? ""),
	},
	// Two crons:
	//   - twice-daily emote refresh (twitch/7tv/bttv/ffz → KV)
	//   - 1-minute analytics sampler (baseline viewer count during a live
	//     session + prunes snapshots > 7 days)
	crons: ["0 */12 * * *", "* * * * *"],
	dev: {
		port: 3000,
	},
});

export const web = await Nextjs("web", {
	name: "tv",
	cwd: "../../apps/web",
	adopt: true,
	// Custom domain attaches `tv.mrdemonwolf.com` to the web worker. Cookies
	// stay first-party there; api stays on workers.dev and is reached via
	// the same-origin /api/* rewrite in next.config.ts.
	domains: [{ domainName: "tv.mrdemonwolf.com", adopt: true }],
	bindings: {
		NEXT_PUBLIC_SERVER_URL: server.url!,
		DB: db,
		PUBLIC_BUCKET: publicBucket,
		ISR_BUCKET: isrBucket,
		CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
		BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
		BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL!,
	},
	dev: {
		env: {
			PORT: "3001",
		},
	},
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
