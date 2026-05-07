// In-memory test DB. Spins up libsql :memory:, replays every migration
// SQL file, returns a drizzle instance bound to it. Tests vi.mock the
// @howlcast/db package's createDb to return this.
//
// Why libsql + Node and not vitest-pool-workers? The pool-workers env
// has a long config tail (wrangler.jsonc compat, runtime polyfills,
// etc.) and our routers don't actually use any Worker-specific APIs
// at the DB layer — drizzle-orm/d1 and drizzle-orm/libsql speak the
// same SQL dialect. Trading fidelity for setup time.

import { type Client, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import * as schema from "@howlcast/db/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, "..", "..", "..", "db", "src", "migrations");

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;

// Tests need access to the underlying client to run raw seed SQL — drizzle's
// `.run` expects an SQL template literal, not a plain object. Stash the
// client on the drizzle instance via WeakMap so seed helpers can pull it back.
const clientForDb = new WeakMap<object, Client>();

export async function createTestDb(): Promise<TestDb> {
	const client = createClient({ url: ":memory:" });
	const db = drizzle(client, { schema });
	clientForDb.set(db as unknown as object, client);

	const files = readdirSync(MIGRATIONS_DIR)
		.filter((f) => f.endsWith(".sql"))
		.sort();

	for (const f of files) {
		const sql = readFileSync(join(MIGRATIONS_DIR, f), "utf8");
		const stmts = sql
			.split(/-->\s*statement-breakpoint/i)
			.map((s) => s.trim())
			.filter(Boolean);
		for (const stmt of stmts) {
			await client.execute(stmt);
		}
	}

	return db;
}

function rawClient(db: TestDb): Client {
	const c = clientForDb.get(db as unknown as object);
	if (!c) throw new Error("test db not registered");
	return c;
}

export async function seedSiteConfig(db: TestDb, ownerId: string) {
	await rawClient(db).execute({
		sql: "INSERT INTO channel_config (id, owner_id) VALUES ('site', ?)",
		args: [ownerId],
	});
}

export async function seedUser(
	db: TestDb,
	id: string,
	email: string,
	role: "broadcaster" | "viewer",
) {
	const now = Date.now();
	const c = rawClient(db);
	await c.execute({
		sql: 'INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
		args: [id, email, email, 0, now, now],
	});
	await c.execute({
		sql: "INSERT INTO profiles (user_id, display_name, role, is_invited, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
		args: [id, email.split("@")[0]!, role, role === "broadcaster" ? 1 : 0, now, now],
	});
}
