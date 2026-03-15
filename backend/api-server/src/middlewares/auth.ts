import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const admin = (req.session as any)?.admin;
  if (!admin) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
