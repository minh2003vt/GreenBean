import { Prisma } from "@prisma/client";
import type { NextFunction, Request, RequestHandler, Response } from "express";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableDatabaseError = (error: unknown) =>
  error instanceof Prisma.PrismaClientInitializationError ||
  (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001");

export const withDatabaseRetry = (handler: RequestHandler): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    let lastError: unknown;

    for (const delay of [0, 300, 1000]) {
      if (delay > 0) await sleep(delay);
      try {
        await Promise.resolve(handler(req, res, next));
        return;
      } catch (error) {
        lastError = error;
        if (!isRetryableDatabaseError(error)) break;
      }
    }

    next(lastError);
  };
