import path from "node:path";
import { migrate as migratePostgres } from "drizzle-orm/node-postgres/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { db, getDatabaseDriver, type AppDatabase } from "./index";
import { seedDemoIfNeeded } from "@/lib/demo";

const globalForSetup = globalThis as typeof globalThis & {
  __limhSetup?: Promise<void>;
};

async function setup() {
  const migrationsFolder =
    process.env.MIGRATIONS_DIR ?? path.join(process.cwd(), "drizzle");

  const driver = getDatabaseDriver();
  if (driver === "pglite") {
    await migratePglite(db as never, { migrationsFolder });
  } else {
    await migratePostgres(db as AppDatabase, { migrationsFolder });
  }

  await seedDemoIfNeeded();
}

/**
 * Applies pending SQL migrations once per process, then makes sure the sample
 * community exists (when demo mode is on). Safe to call from every route.
 */
export function ensureDatabase() {
  if (!globalForSetup.__limhSetup) {
    globalForSetup.__limhSetup = setup().catch((error) => {
      globalForSetup.__limhSetup = undefined;
      throw error;
    });
  }
  return globalForSetup.__limhSetup;
}
