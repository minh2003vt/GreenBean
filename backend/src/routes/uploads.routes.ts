import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/error-handler.js";
import { validate } from "../middleware/validate.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";
import { reviewChallengeImage } from "../services/openai.service.js";

const uploadSchema = z.object({
  file: z.string().min(1),
  folder: z.string().default("greenbean"),
});

const challengePictureSchema = z.object({
  file: z.string().min(1),
  folder: z.string().default("greenbean/challenges"),
});

const imageDataUrlPattern = /^data:image\/(png|jpe?g|webp|gif);base64,/i;

export const uploadRouter = Router();

uploadRouter.post(
  "/",
  requireAuth,
  validate(uploadSchema),
  asyncHandler(async (req, res) => {
    const { file, folder } = req.body as z.infer<typeof uploadSchema>;
    const result = await uploadToCloudinary(file, folder);
    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
    });
  }),
);

uploadRouter.post(
  "/challenge-picture",
  requireAuth,
  validate(challengePictureSchema),
  asyncHandler(async (req, res) => {
    const { file, folder } = req.body as z.infer<typeof challengePictureSchema>;
    if (!imageDataUrlPattern.test(file)) {
      throw new ApiError(400, "Please upload a valid image file.");
    }

    let review;
    try {
      review = await reviewChallengeImage(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI review failed";
      console.error("AI image review failed", error);
      throw new ApiError(502, `AI image review failed: ${message}`);
    }

    if (!review.isRelevant || !review.isFresh) {
      throw new ApiError(400, `AI review rejected this image. ${review.notes || "Please upload a fresh farming, soil, or crop-related photo."}`);
    }

    const result = await uploadToCloudinary(file, folder);
    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      aiPassed: true,
      aiReview: review,
    });
  }),
);
