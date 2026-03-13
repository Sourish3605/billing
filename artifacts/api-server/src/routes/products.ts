import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const products = await db.select().from(productsTable).orderBy(productsTable.name);
  res.json(products.map(p => ({
    ...p,
    unitPrice: Number(p.unitPrice),
  })));
});

router.post("/", requireAuth, async (req, res) => {
  const { name, hsnCode, unitPrice, quantity, minStockLevel } = req.body;
  const [product] = await db.insert(productsTable).values({
    name,
    hsnCode: hsnCode || "",
    unitPrice: String(unitPrice),
    quantity: Number(quantity),
    minStockLevel: Number(minStockLevel),
  }).returning();
  res.status(201).json({ ...product, unitPrice: Number(product.unitPrice) });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ ...product, unitPrice: Number(product.unitPrice) });
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, hsnCode, unitPrice, quantity, minStockLevel } = req.body;
  const [product] = await db.update(productsTable).set({
    name,
    hsnCode: hsnCode || "",
    unitPrice: String(unitPrice),
    quantity: Number(quantity),
    minStockLevel: Number(minStockLevel),
  }).where(eq(productsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ ...product, unitPrice: Number(product.unitPrice) });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ success: true, message: "Product deleted" });
});

export default router;
