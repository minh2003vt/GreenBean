import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { isStrongPassword, passwordSchemaText } from "../lib/password.js";
import { authCookieOptions, requireAdmin, requireAuth, signAccessToken } from "../middleware/auth.js";
import { ApiError } from "../middleware/error-handler.js";
import { validate } from "../middleware/validate.js";
import { createOtp, consumeOtp } from "../services/otp.service.js";
import { sendOtpMail } from "../services/mail.service.js";

const passwordField = z.string().refine(isStrongPassword, passwordSchemaText);

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().transform((value) => value.toLowerCase()),
  phone: z.string().min(1).optional(),
  password: passwordField,
});

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
});

const resetPasswordSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  otp: z.string().length(6),
  newPassword: passwordField,
});

const changePasswordSchema = z.object({
  oldPassword: z.string().optional(),
  otp: z.string().length(6).optional(),
  newPassword: passwordField,
}).refine((value) => value.oldPassword || value.otp, "oldPassword or otp is required");

const idParamsSchema = z.object({ id: z.string().uuid() });

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isBlocked: true,
  blockReason: true,
  blockedUntil: true,
  avatarUrl: true,
  createdAt: true,
} as const;

const setSession = (res: import("express").Response, user: { id: string; role: "USER" | "ADMIN"; email: string }) => {
  const token = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  res.cookie("accessToken", token, authCookieOptions);
  return token;
};

export const userRouter = Router();

userRouter.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { password, ...data } = req.body as z.infer<typeof registerSchema>;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { ...data, passwordHash },
      select: publicUserSelect,
    });
    const token = setSession(res, user);

    res.status(201).json({ user, token });
  }),
);

userRouter.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof loginSchema>;
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      throw new ApiError(401, "Invalid email or password");
    }
    if (user.isBlocked) {
      if (user.blockedUntil && user.blockedUntil <= new Date()) {
        await prisma.user.update({ where: { id: user.id }, data: { isBlocked: false, blockReason: null, blockedUntil: null } });
      } else {
        throw new ApiError(403, user.blockReason ? `Your account has been blocked: ${user.blockReason}` : "Your account has been blocked");
      }
    }

    const token = setSession(res, user);
    const { passwordHash: _passwordHash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  }),
);

userRouter.post(
  "/logout",
  (_req, res) => {
    res.clearCookie("accessToken", { path: "/" });
    res.json({ message: "Logged out" });
  },
);

userRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      select: {
        ...publicUserSelect,
        _count: { select: { userChallenges: true, orders: true } },
      },
    });

    const [completedChallenges, rewards] = await Promise.all([
      prisma.userChallenge.count({
        where: { userId: req.user!.id, progressStatus: "COMPLETED" },
      }),
      prisma.userChallenge.count({
        where: { userId: req.user!.id, isWinner: true },
      }),
    ]);

    res.json({ ...user, stats: { completedChallenges, orders: user._count.orders, rewards } });
  }),
);

userRouter.patch(
  "/me",
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: req.body,
      select: publicUserSelect,
    });

    res.json(user);
  }),
);

userRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body as z.infer<typeof forgotPasswordSchema>;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const code = await createOtp(user.id, "PASSWORD_RESET");
      await sendOtpMail(user.email, user.name, code, "GreenBean password reset OTP");
    }

    res.json({ message: "If that email exists, an OTP has been sent" });
  }),
);

userRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body as z.infer<typeof resetPasswordSchema>;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await consumeOtp(user.id, "PASSWORD_RESET", otp))) {
      throw new ApiError(400, "Invalid or expired OTP");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });

    res.json({ message: "Password reset successful" });
  }),
);

userRouter.post(
  "/password/change-otp",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    const code = await createOtp(user.id, "PASSWORD_CHANGE");
    await sendOtpMail(user.email, user.name, code, "GreenBean password change OTP");

    res.json({ message: "OTP sent" });
  }),
);

userRouter.patch(
  "/password",
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { oldPassword, otp, newPassword } = req.body as z.infer<typeof changePasswordSchema>;
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });

    const ok = oldPassword
      ? await bcrypt.compare(oldPassword, user.passwordHash)
      : await consumeOtp(user.id, "PASSWORD_CHANGE", otp!);

    if (!ok) {
      throw new ApiError(400, "Password confirmation failed");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });

    res.json({ message: "Password changed" });
  }),
);

userRouter.get(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: publicUserSelect,
    });
    res.json(users);
  }),
);

userRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  validate(idParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParamsSchema>;
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  }),
);

userRouter.patch(
  "/:id/block",
  requireAuth,
  requireAdmin,
  validate(idParamsSchema, "params"),
  validate(z.object({
    isBlocked: z.boolean(),
    blockReason: z.string().optional(),
    blockedUntil: z.coerce.date().optional().nullable(),
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParamsSchema>;
    const { isBlocked, blockReason, blockedUntil } = req.body as { isBlocked: boolean; blockReason?: string; blockedUntil?: Date | null };
    if (id === req.user!.id) throw new ApiError(400, "Admin cannot block their own account");
    const target = await prisma.user.findUniqueOrThrow({ where: { id }, select: { role: true } });
    if (target.role === "ADMIN") throw new ApiError(400, "Admin accounts cannot be blocked");
    const user = await prisma.user.update({
      where: { id },
      data: {
        isBlocked,
        blockReason: isBlocked ? blockReason : null,
        blockedUntil: isBlocked ? blockedUntil ?? null : null,
      },
      select: publicUserSelect,
    });
    res.json(user);
  }),
);
