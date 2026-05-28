import type { NextFunction, Request, RequestHandler, Response } from "express";
import { withDatabaseRetry } from "../middleware/db-retry.js";

export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  withDatabaseRetry(async (req, res, next) => {
    await handler(req, res, next);
  });
