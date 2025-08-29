import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { DB_DEV_LOGGER } from "~/app";

import * as schema from "./schema";

// If DATABASE_URL is missing, don't throw during module import (this breaks builds).
// Warn instead and export a `db` placeholder so pages and components that import
// `~/db` won't crash at import time. Runtime calls should handle `db` being null.
if (!process.env.DATABASE_URL) {
  console.warn(
    "🔴 DATABASE_URL environment variable is not set. Database features will be disabled."
  );
}

/**
 * Caches the database connection in development to
 * prevent creating a new connection on every HMR update.
 */
type DbConnection = ReturnType<typeof postgres>;
const globalForDb = globalThis as unknown as {
  conn?: DbConnection;
};

export const conn: DbConnection | undefined = process.env.DATABASE_URL
  ? globalForDb.conn ?? postgres(process.env.DATABASE_URL)
  : undefined;

if (process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

// Export a real `db` when DATABASE_URL is present. Otherwise export `null` so
// importers don't fail at module-evaluation time. Call-sites must handle `db`
// potentially being `null` (many data-fetch helpers already catch errors).
export const db: any = process.env.DATABASE_URL
  ? drizzle(conn as DbConnection, {
      logger: DB_DEV_LOGGER && process.env.NODE_ENV !== "production",
      schema,
    })
  : ({} as any);
