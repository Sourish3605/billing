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

app.set("trust proxy", 1);

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

app.use(session({
  name: isProduction ? "__Host-billing.sid" : "billing.sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  unset: "destroy",
  proxy: isProduction,
  store: new PgSessionStore({
    pool,
    tableName: process.env.SESSION_TABLE_NAME || "user_sessions",
    createTableIfMissing: true,
    pruneSessionInterval: 15 * 60,
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
