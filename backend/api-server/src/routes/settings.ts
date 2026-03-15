import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const defaultSettings = {
  shopName: "Sri Gaytri Enterprises",
  address: "123, Main Street",
  city: "Hyderabad",
  state: "Telangana",
  pincode: "500001",
  gstin: "36AABCU9603R1ZX",
  phone: "+91 9876543210",
  email: "srigaytri@example.com",
};

router.get("/", requireAuth, async (_req, res) => {
  const [settings] = await db.select().from(settingsTable).limit(1);
  if (!settings) {
    const [created] = await db.insert(settingsTable).values(defaultSettings).returning();
    res.json(created);
    return;
  }
  res.json(settings);
});

router.put("/", requireAuth, async (req, res) => {
  const { shopName, address, city, state, pincode, gstin, phone, email } = req.body;
  const [existing] = await db.select().from(settingsTable).limit(1);
  if (!existing) {
    const [created] = await db.insert(settingsTable).values({ shopName, address, city, state, pincode, gstin, phone, email }).returning();
    res.json(created);
    return;
  }
  const { eq } = await import("drizzle-orm");
  const [updated] = await db.update(settingsTable).set({ shopName, address, city, state, pincode, gstin, phone, email })
    .where(eq(settingsTable.id, existing.id)).returning();
  res.json(updated);
});

export default router;
