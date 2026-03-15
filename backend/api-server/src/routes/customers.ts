import { Router } from "express";
import { db } from "@workspace/db";
import { customersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const customers = await db.select().from(customersTable).orderBy(customersTable.name);
  res.json(customers);
});

router.post("/", requireAuth, async (req, res) => {
  const { name, address, phone, gstin } = req.body;
  const [customer] = await db.insert(customersTable).values({
    name,
    address: address || "",
    phone: phone || "",
    gstin: gstin || "",
  }).returning();
  res.status(201).json(customer);
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, address, phone, gstin } = req.body;
  const [customer] = await db.update(customersTable).set({
    name,
    address: address || "",
    phone: phone || "",
    gstin: gstin || "",
  }).where(eq(customersTable.id, id)).returning();
  if (!customer) { res.status(404).json({ error: "Customer not found" }); return; }
  res.json(customer);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(customersTable).where(eq(customersTable.id, id));
  res.json({ success: true, message: "Customer deleted" });
});

export default router;
