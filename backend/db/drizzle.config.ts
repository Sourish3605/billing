import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: [
    "./src/schema/admin.ts",
    "./src/schema/customers.ts",
    "./src/schema/products.ts",
    "./src/schema/invoices.ts",
    "./src/schema/settings.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
