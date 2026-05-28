import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";
import { UserRole } from "@prisma/client";
import { env } from "../config/env.js";
import { ApiError } from "./error-handler.js";

type JwtPayload = {
  sub: string;
  role: UserRole;
  email: string;
};

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(
    {
      role: payload.role,
      email: payload.email,
    },
    env.JWT_KEY,
    {
      subject: payload.sub,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresIn: "7d",
    },
  );

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.COOKIE_SECURE,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  try {
    const decoded = jwt.verify(token, env.JWT_KEY, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as jwt.JwtPayload & { role: UserRole; email: string };

    if (!decoded.sub || !decoded.role || !decoded.email) {
      throw new ApiError(401, "Invalid token");
    }

    req.user = { id: decoded.sub, role: decoded.role, email: decoded.email };
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Invalid or expired token");
  }
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== "ADMIN") {
    throw new ApiError(403, "Admin access required");
  }

  next();
};
