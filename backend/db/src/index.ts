import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

function loadDatabaseUrl(): string | undefined {
  // Prefer explicit DATABASE_URL, fall back to NEON_DIRECT_DATABASE_URL if provided
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.NEON_DIRECT_DATABASE_URL) return process.env.NEON_DIRECT_DATABASE_URL;
  try {
    const filePath = fileURLToPath(new URL('../DATABASE_URL.local', import.meta.url));
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8").trim();
      if (content) return content;
    }
  } catch {
    // ignore and fall through
  }

  return undefined;
}

const databaseUrl = loadDatabaseUrl();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });

export * from "./schema";
