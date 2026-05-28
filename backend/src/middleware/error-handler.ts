import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFoundHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (error) {
    next(error);
    return;
  }

  res.status(404).json({ message: "Route not found" });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      issues: error.flatten(),
    });
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({ message: "Unique constraint failed", meta: error.meta });
      return;
    }

    if (error.code === "P2025") {
      res.status(404).json({ message: "Record not found" });
      return;
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({
      message: "Database connection failed",
      detail: "Check DATABASE_URL and make sure the database is reachable.",
    });
    return;
  }

  console.error(error);
  res.status(500).json({ message: "Internal server error" });
};
