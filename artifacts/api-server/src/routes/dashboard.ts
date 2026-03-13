import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, invoicesTable } from "@workspace/db/schema";
import { sql, lte } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const allInvoices = await db.select().from(invoicesTable);
  const todayInvoices = allInvoices.filter(inv => inv.invoiceDate === todayStr);
  const todaySales = todayInvoices.reduce((sum, inv) => sum + Number(inv.finalAmount), 0);

  const products = await db.select().from(productsTable);
  const lowStockProducts = products.filter(p => p.quantity <= p.minStockLevel);

  res.json({
    todaySales,
    totalInvoices: allInvoices.length,
    totalProducts: products.length,
    lowStockProducts: lowStockProducts.map(p => ({
      ...p,
      unitPrice: Number(p.unitPrice),
    })),
  });
});

export default router;
