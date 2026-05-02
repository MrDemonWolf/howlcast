import alchemy from "alchemy";
import {
	D1Database,
	KVNamespace,
	Nextjs,
	R2Bucket,
	Worker,
} from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });
config({ path: "../../apps/server/.env" });

const app = await alchemy("howlcast");

const db = await D1Database("database", {
	name: "howlcast-db",
	migrationsDir: "../../packages/db/src/migrations",
});

const publicBucket = await R2Bucket("public", {
	name: "howlcast-public",
});

const isrBucket = await R2Bucket("isr", {
	name: "howlcast-isr",
});

const emotesKv = await KVNamespace("emotes", {
	title: "HOWLCAST_EMOTES",
});

export const web = await Nextjs("web", {
	name: "howlcast",
	cwd: "../../apps/web",
	bindings: {
		NEXT_PUBLIC_SERVER_URL: alchemy.env.NEXT_PUBLIC_SERVER_URL!,
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

export const server = await Worker("server", {
	name: "howlcast-api",
	cwd: "../../apps/server",
	entrypoint: "src/index.ts",
	compatibility: "node",
	bindings: {
		DB: db,
		PUBLIC_BUCKET: publicBucket,
		EMOTES_KV: emotesKv,
		CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
		BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
		BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL!,
	},
	crons: ["0 */12 * * *"],
	dev: {
		port: 3000,
	},
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
