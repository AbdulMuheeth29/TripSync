import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL is required in production");
}

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  if (!_db) {
    _pool = new pg.Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    _db = drizzle(_pool, { schema });
  }
  return _db as ReturnType<typeof drizzle<typeof schema>>;
}

export type Db = ReturnType<typeof getDb>;
