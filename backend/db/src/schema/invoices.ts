import { pgTable, serial, text, numeric, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  invoiceDate: text("invoice_date").notNull(),
  customerId: integer("customer_id"),
  customerName: text("customer_name").notNull(),
  customerAddress: text("customer_address").notNull().default(""),
  customerGstin: text("customer_gstin").default(""),
  items: jsonb("items").notNull().default([]),
  totalQuantity: numeric("total_quantity", { precision: 12, scale: 2 }).notNull().default("0"),
  subTotal: numeric("sub_total", { precision: 12, scale: 2 }).notNull().default("0"),
  totalCgst: numeric("total_cgst", { precision: 12, scale: 2 }).notNull().default("0"),
  totalSgst: numeric("total_sgst", { precision: 12, scale: 2 }).notNull().default("0"),
  grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull().default("0"),
  roundingOption: text("rounding_option").notNull().default("decimal"),
  customRounding: numeric("custom_rounding", { precision: 12, scale: 2 }),
  finalAmount: numeric("final_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  amountInWords: text("amount_in_words").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
