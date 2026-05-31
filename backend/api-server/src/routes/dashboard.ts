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
  // Use createdAt timestamp for calculating today/month/year buckets — more reliable than freeform invoiceDate
  const todayInvoices = allInvoices.filter(inv => {
    try {
      const d = new Date(inv.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    } catch (e) {
      return String(inv.invoiceDate) === todayStr;
    }
  });

  const monthlyInvoices = allInvoices.filter(inv => {
    try {
      const d = new Date(inv.createdAt);
      return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
    } catch (e) {
      return String(inv.invoiceDate).startsWith(todayStr.slice(0, 7));
    }
  });

  const yearlyInvoices = allInvoices.filter(inv => {
    try {
      const d = new Date(inv.createdAt);
      return d.getFullYear() === today.getFullYear();
    } catch (e) {
      return String(inv.invoiceDate).startsWith(todayStr.slice(0, 4));
    }
  });

  const todaySales = todayInvoices.reduce((sum, inv) => sum + Number(inv.finalAmount || 0), 0);
  const monthlySales = monthlyInvoices.reduce((sum, inv) => sum + Number(inv.finalAmount || 0), 0);
  const yearlySales = yearlyInvoices.reduce((sum, inv) => sum + Number(inv.finalAmount || 0), 0);
  const totalSales = allInvoices.reduce((sum, inv) => sum + Number(inv.finalAmount || 0), 0);

  const products = await db.select().from(productsTable);
  const lowStockProducts = products.filter(p => p.quantity <= p.minStockLevel);

  res.json({
    totalSales,
    monthlySales,
    yearlySales,
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
