import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

type RequestPart = "body" | "params" | "query";

export const validate =
  (schema: ZodSchema, part: RequestPart = "body"): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.parse(req[part]);
    if (part === "query") {
      Object.defineProperty(req, "query", {
        value: parsed,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    } else {
      req[part] = parsed;
    }
    next();
  };
