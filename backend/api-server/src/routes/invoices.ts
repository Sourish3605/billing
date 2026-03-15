import { Router } from "express";
import { db } from "@workspace/db";
import { invoicesTable, productsTable } from "@workspace/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

function normalizeInvoiceNumber(value: unknown): string {
  return String(value || "").trim();
}

async function generateInvoiceNumber(): Promise<string> {
  const invoices = await db.select({ invoiceNumber: invoicesTable.invoiceNumber }).from(invoicesTable);
  const numericInvoiceNumbers = invoices
    .map((invoice) => normalizeInvoiceNumber(invoice.invoiceNumber))
    .filter((invoiceNumber) => /^\d+$/.test(invoiceNumber))
    .map((invoiceNumber) => parseInt(invoiceNumber, 10));

  const nextNumber = numericInvoiceNumbers.length > 0
    ? Math.max(...numericInvoiceNumbers) + 1
    : invoices.length + 1;

  return String(nextNumber).padStart(2, "0");
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
  const requestedInvoiceNumber = normalizeInvoiceNumber(body.invoiceNumber);
  const invoiceNumber = requestedInvoiceNumber || await generateInvoiceNumber();

  const [duplicateInvoice] = await db.select({ id: invoicesTable.id })
    .from(invoicesTable)
    .where(eq(invoicesTable.invoiceNumber, invoiceNumber));

  if (duplicateInvoice) {
    res.status(409).json({ error: "Invoice number already exists" });
    return;
  }

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
    const pid = parseInt(item.productId);
    const qty = parseInt(item.quantity) || 0;
    if (pid && qty > 0) {
      await db.update(productsTable)
        .set({ quantity: sql`${productsTable.quantity} - ${qty}` })
        .where(eq(productsTable.id, pid));
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

  // Fetch existing invoice to reverse its stock deductions
  const [existingInvoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  if (!existingInvoice) { res.status(404).json({ error: "Invoice not found" }); return; }

  const invoiceNumber = normalizeInvoiceNumber(body.invoiceNumber) || existingInvoice.invoiceNumber;
  const [duplicateInvoice] = await db.select({ id: invoicesTable.id })
    .from(invoicesTable)
    .where(and(eq(invoicesTable.invoiceNumber, invoiceNumber), ne(invoicesTable.id, id)));

  if (duplicateInvoice) {
    res.status(409).json({ error: "Invoice number already exists" });
    return;
  }

  const [invoice] = await db.update(invoicesTable).set({
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
  }).where(eq(invoicesTable.id, id)).returning();

  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

  // Reverse old stock deductions
  for (const item of ((existingInvoice.items as any[]) || [])) {
    const pid = parseInt(item.productId);
    const qty = parseInt(item.quantity) || 0;
    if (pid && qty > 0) {
      await db.update(productsTable)
        .set({ quantity: sql`${productsTable.quantity} + ${qty}` })
        .where(eq(productsTable.id, pid));
    }
  }

  // Apply new stock deductions
  for (const item of (body.items || [])) {
    const pid = parseInt(item.productId);
    const qty = parseInt(item.quantity) || 0;
    if (pid && qty > 0) {
      await db.update(productsTable)
        .set({ quantity: sql`${productsTable.quantity} - ${qty}` })
        .where(eq(productsTable.id, pid));
    }
  }

  res.json(formatInvoice(invoice));
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);

  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

  // Restore stock for each item before deleting
  for (const item of ((invoice.items as any[]) || [])) {
    const pid = parseInt(item.productId);
    const qty = parseInt(item.quantity) || 0;
    if (pid && qty > 0) {
      await db.update(productsTable)
        .set({ quantity: sql`${productsTable.quantity} + ${qty}` })
        .where(eq(productsTable.id, pid));
    }
  }

  await db.delete(invoicesTable).where(eq(invoicesTable.id, id));
  res.json({ success: true });
});

export default router;
