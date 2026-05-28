import { StepMediaType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { toSlug } from "../lib/slug.js";
import { toYouTubeEmbedUrl } from "../lib/youtube.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/error-handler.js";
import { validate } from "../middleware/validate.js";

const slugParamsSchema = z.object({ slug: z.string().min(1) });
const idParamsSchema = z.object({ id: z.string().uuid() });
const stepParamsSchema = z.object({ problemId: z.string().uuid(), stepId: z.string().uuid() });
const mediaParamsSchema = z.object({ problemId: z.string().uuid(), stepId: z.string().uuid(), mediaId: z.string().uuid() });

const mediaSchema = z.object({
  mediaType: z.nativeEnum(StepMediaType),
  url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  durationSec: z.number().int().positive().optional(),
  sortOrder: z.number().int().min(0).default(0),
});
const updateMediaSchema = mediaSchema.partial();

const normalizeMediaUrl = <T extends { url?: string }>(media: T): T => ({
  ...media,
  url: media.url ? toYouTubeEmbedUrl(media.url) : media.url,
});

const normalizeStepMedia = <T extends { media?: Array<z.infer<typeof mediaSchema>> }>(step: T): T => ({
  ...step,
  media: step.media?.map(normalizeMediaUrl),
});

const createProblemSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().min(1),
  thumbnailUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
  steps: z.array(
    z.object({
      stepNumber: z.number().int().min(1).max(5),
      title: z.string().min(1),
      description: z.string().min(1),
      thumbnailUrl: z.string().url().optional(),
      media: z.array(mediaSchema).optional(),
    }),
  ).max(5).optional(),
});

const updateProblemSchema = createProblemSchema.omit({ steps: true }).partial();
const createStepSchema = z.object({
  stepNumber: z.number().int().min(1).max(5),
  title: z.string().min(1),
  description: z.string().min(1),
  thumbnailUrl: z.string().url().optional(),
  media: z.array(mediaSchema).optional(),
});
const updateStepSchema = createStepSchema.partial();

const validateStepMedia = (media: z.infer<typeof mediaSchema>[] = []) => {
  const imageCount = media.filter((item) => item.mediaType === "IMAGE").length;
  const videoCount = media.filter((item) => item.mediaType === "VIDEO").length;
  const audioCount = media.filter((item) => item.mediaType === "AUDIO").length;
  if (imageCount > 5) {
    throw new ApiError(400, "Each step can have at most 5 pictures");
  }
  if (videoCount > 1) {
    throw new ApiError(400, "Each step can have only one video");
  }
  if (audioCount > 1) {
    throw new ApiError(400, "Each step can have only one audio");
  }
};

const ensureStepPictureLimit = async (stepId: string, extraImages = 0) => {
  const currentImages = await prisma.stepMedia.count({ where: { stepId, mediaType: "IMAGE" } });
  if (currentImages + extraImages > 5) {
    throw new ApiError(400, "Each step can have at most 5 pictures");
  }
};

const ensureSingleStepMediaType = async (stepId: string, mediaType: StepMediaType, ignoreMediaId?: string) => {
  if (mediaType === "IMAGE") return;
  const existing = await prisma.stepMedia.findFirst({
    where: {
      stepId,
      mediaType,
      id: ignoreMediaId ? { not: ignoreMediaId } : undefined,
    },
  });
  if (existing) {
    throw new ApiError(400, `Each step can have only one ${mediaType.toLowerCase()}`);
  }
};

export const problemRouter = Router();

problemRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const problems = await prisma.problem.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: {
        steps: {
          orderBy: { stepNumber: "asc" },
          select: {
            id: true,
            stepNumber: true,
            title: true,
            description: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    res.json(problems);
  }),
);

problemRouter.get(
  "/:slug",
  validate(slugParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    const { slug } = req.params as z.infer<typeof slugParamsSchema>;
    const problem = await prisma.problem.findUnique({
      where: { slug },
      include: { steps: { orderBy: { stepNumber: "asc" }, include: { media: { orderBy: { sortOrder: "asc" } } } } },
    });

    if (!problem) throw new ApiError(404, "Problem not found");
    res.json(problem);
  }),
);

problemRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  validate(createProblemSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createProblemSchema>;
    body.steps?.forEach((step) => validateStepMedia(step.media));
    const steps = body.steps?.map(normalizeStepMedia);
    const problem = await prisma.problem.create({
      data: {
        title: body.title,
        slug: body.slug ?? toSlug(body.title),
        description: body.description,
        thumbnailUrl: body.thumbnailUrl,
        sortOrder: body.sortOrder,
        steps: steps
          ? { create: steps.map((step) => ({ ...step, media: step.media ? { create: step.media } : undefined })) }
          : undefined,
      },
      include: { steps: { include: { media: true } } },
    });

    res.status(201).json(problem);
  }),
);

problemRouter.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  validate(idParamsSchema, "params"),
  validate(updateProblemSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParamsSchema>;
    const problem = await prisma.problem.update({ where: { id }, data: req.body });
    res.json(problem);
  }),
);

problemRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  validate(idParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParamsSchema>;
    await prisma.problem.delete({ where: { id } });
    res.status(204).send();
  }),
);

problemRouter.get(
  "/by-id/:id",
  validate(idParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParamsSchema>;
    const problem = await prisma.problem.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepNumber: "asc" }, include: { media: { orderBy: { sortOrder: "asc" } } } } },
    });
    if (!problem) throw new ApiError(404, "Problem not found");
    res.json(problem);
  }),
);

problemRouter.post(
  "/:id/steps",
  requireAuth,
  requireAdmin,
  validate(idParamsSchema, "params"),
  validate(createStepSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParamsSchema>;
    const body = req.body as z.infer<typeof createStepSchema>;
    validateStepMedia(body.media);
    const stepBody = normalizeStepMedia(body);

    const existing = await prisma.step.count({ where: { problemId: id } });
    if (existing >= 5) throw new ApiError(400, "Each problem can have at most 5 steps");

    const step = await prisma.step.create({
      data: {
        problemId: id,
        stepNumber: stepBody.stepNumber,
        title: stepBody.title,
        description: stepBody.description,
        thumbnailUrl: stepBody.thumbnailUrl,
        media: stepBody.media ? { create: stepBody.media } : undefined,
      },
      include: { media: true },
    });

    res.status(201).json(step);
  }),
);

problemRouter.patch(
  "/:problemId/steps/:stepId",
  requireAuth,
  requireAdmin,
  validate(stepParamsSchema, "params"),
  validate(updateStepSchema),
  asyncHandler(async (req, res) => {
    const { stepId } = req.params as z.infer<typeof stepParamsSchema>;
    const { media, ...data } = req.body as z.infer<typeof updateStepSchema>;
    validateStepMedia(media);
    const normalizedMedia = media?.map(normalizeMediaUrl);
    const step = await prisma.step.update({
      where: { id: stepId },
      data: {
        ...data,
        media: normalizedMedia ? { deleteMany: {}, create: normalizedMedia } : undefined,
      },
      include: { media: true },
    });

    res.json(step);
  }),
);

problemRouter.delete(
  "/:problemId/steps/:stepId",
  requireAuth,
  requireAdmin,
  validate(stepParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    const { stepId } = req.params as z.infer<typeof stepParamsSchema>;
    await prisma.step.delete({ where: { id: stepId } });
    res.status(204).send();
  }),
);

problemRouter.post(
  "/:problemId/steps/:stepId/media",
  requireAuth,
  requireAdmin,
  validate(stepParamsSchema, "params"),
  validate(mediaSchema),
  asyncHandler(async (req, res) => {
    const { stepId } = req.params as z.infer<typeof stepParamsSchema>;
    const body = normalizeMediaUrl(req.body as z.infer<typeof mediaSchema>);
    await prisma.step.findUniqueOrThrow({ where: { id: stepId } });
    if (body.mediaType === "IMAGE") await ensureStepPictureLimit(stepId, 1);
    await ensureSingleStepMediaType(stepId, body.mediaType);
    const media = await prisma.stepMedia.create({ data: { ...body, stepId } });
    res.status(201).json(media);
  }),
);

problemRouter.patch(
  "/:problemId/steps/:stepId/media/:mediaId",
  requireAuth,
  requireAdmin,
  validate(mediaParamsSchema, "params"),
  validate(updateMediaSchema),
  asyncHandler(async (req, res) => {
    const { stepId, mediaId } = req.params as z.infer<typeof mediaParamsSchema>;
    const body = normalizeMediaUrl(req.body as z.infer<typeof updateMediaSchema>);
    const existing = await prisma.stepMedia.findUniqueOrThrow({ where: { id: mediaId } });
    if (existing.stepId !== stepId) throw new ApiError(404, "Step media not found");
    if (existing.mediaType !== "IMAGE" && body.mediaType === "IMAGE") await ensureStepPictureLimit(stepId, 1);
    if (body.mediaType) await ensureSingleStepMediaType(stepId, body.mediaType, mediaId);
    const media = await prisma.stepMedia.update({ where: { id: mediaId }, data: body });
    res.json(media);
  }),
);

problemRouter.delete(
  "/:problemId/steps/:stepId/media/:mediaId",
  requireAuth,
  requireAdmin,
  validate(mediaParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    const { stepId, mediaId } = req.params as z.infer<typeof mediaParamsSchema>;
    const existing = await prisma.stepMedia.findUniqueOrThrow({ where: { id: mediaId } });
    if (existing.stepId !== stepId) throw new ApiError(404, "Step media not found");
    await prisma.stepMedia.delete({ where: { id: mediaId } });
    res.status(204).send();
  }),
);
