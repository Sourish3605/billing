import express, { type Express } from "express";
import { pool } from "@workspace/db";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import session from "express-session";
import router from "./routes/index.js";

const app: Express = express();
const isProduction = process.env.NODE_ENV === "production";
const sessionMaxAgeDays = Number(process.env.SESSION_TTL_DAYS || 30);
const sessionMaxAgeMs = Math.max(1, sessionMaxAgeDays) * 24 * 60 * 60 * 1000;
const sessionSecret = process.env.SESSION_SECRET || (!isProduction ? "srigaytri-billing-secret-2024" : "");
const sessionTableNameCandidate = process.env.SESSION_TABLE_NAME || "user_sessions";
const sessionTableName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(sessionTableNameCandidate)
  ? sessionTableNameCandidate
  : "user_sessions";
const quotedSessionTableName = `"${sessionTableName.replace(/"/g, "\"\"")}"`;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set in production.");
}

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

const PgSessionStore = connectPgSimple(session);
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

let ensureSessionTablePromise: Promise<void> | null = null;

function ensureSessionTable(): Promise<void> {
  if (!ensureSessionTablePromise) {
    ensureSessionTablePromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${quotedSessionTableName} (
          sid varchar NOT NULL,
          sess json NOT NULL,
          expire timestamp(6) NOT NULL,
          CONSTRAINT ${sessionTableName}_pkey PRIMARY KEY (sid)
        );
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_${sessionTableName}_expire
        ON ${quotedSessionTableName} (expire);
      `);
    })().catch((error) => {
      ensureSessionTablePromise = null;
      throw error;
    });
  }

  return ensureSessionTablePromise;
}

app.set("trust proxy", true);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(async (_req, _res, next) => {
  try {
    await ensureSessionTable();
    next();
  } catch (error) {
    console.error("Failed to initialize session table", error);
    next(error);
  }
});

app.use(session({
  name: isProduction ? "__Host-billing.sid" : "billing.sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  unset: "destroy",
  proxy: isProduction,
  store: new PgSessionStore({
    pool,
    tableName: sessionTableName,
    createTableIfMissing: true,
    pruneSessionInterval: 15 * 60,
    errorLog: (error) => {
      console.error("Session store error", error);
    },
  }),
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    maxAge: sessionMaxAgeMs,
  },
}));

app.use("/api", router);

export default app;
