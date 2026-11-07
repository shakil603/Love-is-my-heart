import { mkdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Love Is My Heart runs on PostgreSQL. Two drivers are supported:
 *
 *  - `DATABASE_URL` is set  -> the regular PostgreSQL server (`pg`).
 *  - no `DATABASE_URL`      -> PGlite, the WASM build of PostgreSQL that stores
 *                              its data on disk. This keeps local development
 *                              and previews zero-config while still being a
 *                              real relational database.
 *
 * Both drivers speak the same SQL dialect, so the Drizzle schema and every
 * query are shared.
 *
 * The connection is created lazily. Importing this module during `next build`
 * must not start a database engine, otherwise the build worker aborts it.
 */
export type AppDatabase = NodePgDatabase<typeof schema>;
export type DatabaseDriver = "postgres" | "pglite";

const globalForDb = globalThis as typeof globalThis & {
  __limhDb?: AppDatabase;
  __limhPool?: Pool;
  __limhPglite?: PGlite;
  __limhDriver?: DatabaseDriver;
};

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const pool = new Pool({
      connectionString: databaseUrl,
      max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
    });
    return {
      db: drizzlePostgres(pool, { schema }) as AppDatabase,
      driver: "postgres" as const,
      pool,
    };
  }

  const dataDir =
    process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), ".data", "limh");
  // PGlite creates the leaf directory itself, but not its parents.
  mkdirSync(path.dirname(dataDir), { recursive: true });
  const client = new PGlite(dataDir);
  return {
    db: drizzlePglite(client, { schema }) as unknown as AppDatabase,
    driver: "pglite" as const,
    client,
  };
}

export function getDb(): AppDatabase {
  if (globalForDb.__limhDb) return globalForDb.__limhDb;

  const created = createDatabase();
  globalForDb.__limhDb = created.db;
  globalForDb.__limhDriver = created.driver;
  if (created.driver === "postgres") globalForDb.__limhPool = created.pool;
  if (created.driver === "pglite") globalForDb.__limhPglite = created.client;
  return created.db;
}

export function getDatabaseDriver(): DatabaseDriver {
  getDb();
  return globalForDb.__limhDriver ?? "pglite";
}

/**
 * A lazy proxy so existing imports can keep using `db.select()` while the
 * actual driver is only opened on the first query.
 */
export const db: AppDatabase = new Proxy({} as AppDatabase, {
  get(_target, property) {
    const instance = getDb();
    const value = Reflect.get(instance as object, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
