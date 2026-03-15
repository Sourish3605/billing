import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import customersRouter from "./customers.js";
import invoicesRouter from "./invoices.js";
import settingsRouter from "./settings.js";
import dashboardRouter from "./dashboard.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/customers", customersRouter);
router.use("/invoices", invoicesRouter);
router.use("/settings", settingsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
