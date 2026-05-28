import { ChallengeStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { getPagination, paginationQuerySchema } from "../lib/pagination.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/error-handler.js";
import { validate } from "../middleware/validate.js";
import { sendMail } from "../services/mail.service.js";

const challengeQuerySchema = paginationQuerySchema.extend({ status: z.nativeEnum(ChallengeStatus).optional() });
const idParamsSchema = z.object({ id: z.string().uuid() });
const userChallengeParamsSchema = z.object({ id: z.string().uuid(), userChallengeId: z.string().uuid() });

const challengeBaseSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  thumbnailUrl: z.string().url().optional(),
  status: z.nativeEnum(ChallengeStatus).default("DRAFT"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const createChallengeSchema = challengeBaseSchema.refine((value) => value.endDate >= value.startDate, "endDate must be after startDate");

const updateChallengeSchema = challengeBaseSchema.partial().refine((value) => {
  if (value.startDate && value.endDate) return value.endDate >= value.startDate;
  return true;
}, "endDate must be after startDate");

type ActiveOverlapInput = {
  status?: ChallengeStatus;
  startDate?: Date;
  endDate?: Date;
  excludeId?: string;
};

const ensureNoActiveOverlap = async (options: ActiveOverlapInput) => {
  const { status, startDate, endDate, excludeId } = options;
  if (status !== "ACTIVE" || !startDate || !endDate) return;
  const existing = await prisma.challenge.findFirst({
    where: {
      status: "ACTIVE",
      id: excludeId ? { not: excludeId } : undefined,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    select: { id: true, title: true },
  });
  if (existing) {
    throw new ApiError(400, `Cannot create or activate an overlapping active challenge. Existing active challenge: ${existing.title}`);
  }
};

export const challengeRouter = Router();

challengeRouter.get(
  "/",
  validate(challengeQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof challengeQuerySchema>;
    const { skip, take, page, limit } = getPagination(query);
    const where = { status: query.status };
    const [items, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        skip,
        take,
        orderBy: { startDate: "desc" },
        include: { createdBy: { select: { id: true, name: true } }, _count: { select: { userChallenges: true } } },
      }),
      prisma.challenge.count({ where }),
    ]);

    res.json({ items, meta: { page, limit, total } });
  }),
);

challengeRouter.get(
  "/current",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const challenge = await prisma.challenge.findFirst({
      where: {
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { userChallenges: true } } },
    });

    res.json(challenge);
  }),
);

challengeRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  validate(createChallengeSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createChallengeSchema>;
    await ensureNoActiveOverlap({ status: body.status, startDate: body.startDate, endDate: body.endDate });
    const challenge = await prisma.challenge.create({ data: { ...body, createdById: req.user!.id } });
    res.status(201).json(challenge);
  }),
);

challengeRouter.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  validate(idParamsSchema, "params"),
  validate(updateChallengeSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParamsSchema>;
    const body = req.body as z.infer<typeof updateChallengeSchema>;
    const existing = await prisma.challenge.findUniqueOrThrow({ where: { id } });
    const nextStatus = body.status ?? existing.status;
    const nextStartDate = body.startDate ?? existing.startDate;
    const nextEndDate = body.endDate ?? existing.endDate;
    await ensureNoActiveOverlap({ status: nextStatus, startDate: nextStartDate, endDate: nextEndDate, excludeId: id });
    const challenge = await prisma.challenge.update({ where: { id }, data: body });
    res.json(challenge);
  }),
);

challengeRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  validate(idParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParamsSchema>;
    await prisma.challenge.delete({ where: { id } });
    res.status(204).send();
  }),
);

challengeRouter.get(
  "/:id/participants",
  requireAuth,
  requireAdmin,
  validate(idParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParamsSchema>;
    const participants = await prisma.userChallenge.findMany({
      where: { challengeId: id },
      orderBy: { joinedAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true, phone: true } }, pictures: true },
    });

    res.json(participants);
  }),
);

challengeRouter.patch(
  "/:id/participants/:userChallengeId/review",
  requireAuth,
  requireAdmin,
  validate(userChallengeParamsSchema, "params"),
  validate(z.object({
    reviewStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    reviewNote: z.string().optional(),
    isWinner: z.boolean().optional(),
    rewardPaid: z.boolean().optional(),
  })),
  asyncHandler(async (req, res) => {
    const { userChallengeId } = req.params as z.infer<typeof userChallengeParamsSchema>;
    const body = req.body as { reviewStatus?: "PENDING" | "APPROVED" | "REJECTED"; reviewNote?: string; isWinner?: boolean; rewardPaid?: boolean };
    const updated = await prisma.userChallenge.update({
      where: { id: userChallengeId },
      data: {
        reviewStatus: body.reviewStatus,
        reviewNote: body.reviewNote,
        isWinner: body.isWinner,
        rewardPaidAt: body.rewardPaid ? new Date() : undefined,
      },
      include: { user: true, challenge: true },
    });

    if (body.isWinner) {
      await sendMail({
        to: updated.user.email,
        toName: updated.user.name,
        subject: `GreenBean challenge reward`,
        html: `<p>Hello ${updated.user.name},</p><p>Your <strong>${updated.challenge.title}</strong> challenge progress has been selected for a reward.</p><p>The GreenBean team will contact you with the next steps.</p>`,
      });
    }

    res.json(updated);
  }),
);
