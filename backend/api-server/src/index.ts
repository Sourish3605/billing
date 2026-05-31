import app from "./app";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"] || (process.env.NODE_ENV === "production" ? undefined : "8080");

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

(async () => {
  try {
    // Ensure admin table exists, then seed a default admin user for local development.
    await pool.query(
      "CREATE TABLE IF NOT EXISTS admin (id serial PRIMARY KEY, username text UNIQUE NOT NULL, password text NOT NULL)",
    );
    await pool.query(
      "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_igst numeric(12,2) NOT NULL DEFAULT 0",
    );
    const res = await pool.query("SELECT count(*)::int AS c FROM admin");
    const count = res.rows && res.rows[0] ? Number(res.rows[0].c) : 0;
    if (count === 0) {
      await pool.query(
        "INSERT INTO admin (username, password) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password",
        ["admin", "password"],
      );
      console.log("Created default admin: admin / password");
    }
  } catch (err) {
    console.error("Failed to ensure default admin", err);
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
})();
