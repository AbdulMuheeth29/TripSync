import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

/**
 * PostgreSQL connection. Required in production.
 * Connection string format: postgresql://username:password@host:port/database?sslmode=require
 * Pool settings: max 20 connections, idle timeout 30s, connection timeout 10s.
 */
const connectionString = process.env.DATABASE_URL;

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
