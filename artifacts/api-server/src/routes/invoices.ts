import { Router } from "express";
import { db } from "@workspace/db";
import { invoicesTable, productsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}${month}-${random}`;
}

function formatInvoice(inv: any) {
  return {
    ...inv,
    totalQuantity: Number(inv.totalQuantity),
    subTotal: Number(inv.subTotal),
    totalCgst: Number(inv.totalCgst),
    totalSgst: Number(inv.totalSgst),
    grandTotal: Number(inv.grandTotal),
    customRounding: inv.customRounding ? Number(inv.customRounding) : null,
    finalAmount: Number(inv.finalAmount),
    items: Array.isArray(inv.items) ? inv.items : [],
  };
}

router.get("/", requireAuth, async (_req, res) => {
  const invoices = await db.select().from(invoicesTable).orderBy(sql`${invoicesTable.createdAt} DESC`);
  res.json(invoices.map(formatInvoice));
});

router.post("/", requireAuth, async (req, res) => {
  const body = req.body;
  const invoiceNumber = generateInvoiceNumber();

  const [invoice] = await db.insert(invoicesTable).values({
    invoiceNumber,
    invoiceDate: body.invoiceDate,
    customerId: body.customerId || null,
    customerName: body.customerName,
    customerAddress: body.customerAddress || "",
    customerGstin: body.customerGstin || "",
    items: body.items || [],
    totalQuantity: String(body.totalQuantity || 0),
    subTotal: String(body.subTotal || 0),
    totalCgst: String(body.totalCgst || 0),
    totalSgst: String(body.totalSgst || 0),
    grandTotal: String(body.grandTotal || 0),
    roundingOption: body.roundingOption || "decimal",
    customRounding: body.customRounding ? String(body.customRounding) : null,
    finalAmount: String(body.finalAmount || 0),
    amountInWords: body.amountInWords || "",
  }).returning();

  // Deduct stock for each item
  for (const item of (body.items || [])) {
    if (item.productId) {
      await db.update(productsTable)
        .set({ quantity: sql`${productsTable.quantity} - ${item.quantity}` })
        .where(eq(productsTable.id, item.productId));
    }
  }

  res.status(201).json(formatInvoice(invoice));
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.json(formatInvoice(invoice));
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const body = req.body;

  const [invoice] = await db.update(invoicesTable).set({
    invoiceDate: body.invoiceDate,
    customerId: body.customerId || null,
    customerName: body.customerName,
    customerAddress: body.customerAddress || "",
    customerGstin: body.customerGstin || "",
    items: body.items || [],
    totalQuantity: String(body.totalQuantity || 0),
    subTotal: String(body.subTotal || 0),
    totalCgst: String(body.totalCgst || 0),
    totalSgst: String(body.totalSgst || 0),
    grandTotal: String(body.grandTotal || 0),
    roundingOption: body.roundingOption || "decimal",
    customRounding: body.customRounding ? String(body.customRounding) : null,
    finalAmount: String(body.finalAmount || 0),
    amountInWords: body.amountInWords || "",
  }).where(eq(invoicesTable.id, id)).returning();

  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.json(formatInvoice(invoice));
});

export default router;
