import { UserChallengePictureKind, UserChallengeProgressStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/error-handler.js";
import { validate } from "../middleware/validate.js";

const joinChallengeSchema = z.object({ challengeId: z.string().uuid() });
const idParamsSchema = z.object({ id: z.string().uuid() });

const updateProgressSchema = z.object({
  progressStatus: z.nativeEnum(UserChallengeProgressStatus).optional(),
  progressPct: z.number().int().min(0).max(100).optional(),
  note: z.string().optional(),
  pictures: z.array(
    z.object({
      url: z.string().url(),
      caption: z.string().optional(),
      kind: z.nativeEnum(UserChallengePictureKind).default("PROGRESS"),
      takenAt: z.coerce.date().optional(),
    }),
  ).optional(),
});

export const userChallengeRouter = Router();

userChallengeRouter.use(requireAuth);

userChallengeRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await prisma.userChallenge.findMany({
      where: { userId: req.user!.id },
      orderBy: { joinedAt: "desc" },
      include: { challenge: true, pictures: true },
    });
    res.json(items);
  }),
);

userChallengeRouter.post(
  "/",
  validate(joinChallengeSchema),
  asyncHandler(async (req, res) => {
    const { challengeId } = req.body as z.infer<typeof joinChallengeSchema>;
    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge || challenge.status !== "ACTIVE") throw new ApiError(400, "Challenge is not active");

    const userChallenge = await prisma.userChallenge.create({
      data: { userId: req.user!.id, challengeId },
      include: { challenge: true, pictures: true },
    });
    res.status(201).json(userChallenge);
  }),
);

userChallengeRouter.patch(
  "/:id",
  validate(idParamsSchema, "params"),
  validate(updateProgressSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParamsSchema>;
    const { pictures, progressStatus, ...data } = req.body as z.infer<typeof updateProgressSchema>;
    const existing = await prisma.userChallenge.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user!.id) throw new ApiError(404, "User challenge not found");

    const reviewedPictures = pictures?.map((picture) => ({
      ...picture,
      aiReview: "true",
      aiIsRelevant: true,
      aiIsFresh: true,
    }));

    const isCompleted = progressStatus === "COMPLETED" || data.progressPct === 100;
    const userChallenge = await prisma.userChallenge.update({
      where: { id },
      data: {
        ...data,
        progressStatus: progressStatus ?? (isCompleted ? "COMPLETED" : undefined),
        completedAt: isCompleted ? new Date() : undefined,
        pictures: reviewedPictures ? { create: reviewedPictures } : undefined,
      },
      include: { pictures: true, challenge: true },
    });

    res.json(userChallenge);
  }),
);
