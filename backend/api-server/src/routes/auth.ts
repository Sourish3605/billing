import { Router } from "express";
import { db } from "@workspace/db";
import { adminTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  const admin = await db.select().from(adminTable).where(eq(adminTable.username, username)).limit(1);
  if (!admin.length || admin[0].password !== password) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  (req.session as any).admin = { username: admin[0].username };
  res.json({ success: true, username: admin[0].username });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out" });
  });
});

router.get("/me", (req, res) => {
  const admin = (req.session as any).admin;
  if (!admin) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ username: admin.username, authenticated: true });
});

export default router;
