import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const adminTable = pgTable("admin", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export type Admin = typeof adminTable.$inferSelect;
