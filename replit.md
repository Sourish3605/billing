# GST Billing & Inventory Management System

## Overview

A professional web-based shop billing and inventory management system similar to GST retail billing software. Features a traditional professional GST tax invoice layout.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/billing-app)
- **Backend**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **PDF/Print**: jsPDF + jspdf-autotable, window.print()
- **Session**: express-session

## Default Login Credentials

- **Username**: Srigaytri
- **Password**: Srigaytri@123

## Features

- Admin login with session authentication
- Dashboard with today's sales, invoice count, product count, low stock alerts
- Product/Inventory management with low stock alerts
- Customer management with saved customer dropdown in billing
- Professional GST Tax Invoice generation
  - Auto-generated invoice numbers
  - GST rate fixed at 18% for rate calculation
  - CGST% and SGST% manually entered by user
  - Rate formula: (UnitPrice + UnitPrice*0.18) × 100 / 105
  - Amount = Rate × Quantity
  - Rounding options: decimal, nearest rupee, custom
  - Amount in words (Indian format: Lakh, Crore)
  - Print/PDF invoice
- Invoice history with edit capability
- Admin settings for shop details (printed on every invoice)
- Stock auto-reduction when invoice is created

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   │   └── src/routes/     # auth, products, customers, invoices, settings, dashboard
│   └── billing-app/        # React + Vite frontend
│       └── src/
│           ├── pages/      # login, dashboard, products, customers, invoices, settings
│           ├── components/ # Sidebar, AppLayout, InvoicePrintView
│           └── hooks/      # use-auth, use-products, use-customers, use-invoices, use-settings
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/     # products, customers, invoices, settings, admin tables
```

## Default Shop Settings (pre-seeded)

- Shop Name: Sri Gaytri Enterprises
- Address: 123, Main Street, Hyderabad, Telangana - 500001
- GSTIN: 36AABCU9603R1ZX
- Phone: +91 9876543210

## Running

Both workflows start automatically:
- `artifacts/api-server: API Server` - Express backend on port 8080
- `artifacts/billing-app: web` - Vite frontend on port 23436
