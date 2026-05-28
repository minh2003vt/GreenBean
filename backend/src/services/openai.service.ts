import OpenAI from "openai";
import { env } from "../config/env.js";

const client = env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
  : null;

export type ImageReviewResult = {
  isRelevant: boolean;
  isFresh: boolean;
  notes: string;
};

const cleanJson = (text: string) =>
  text
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

const parseReview = (text: string): ImageReviewResult => {
  try {
    const parsed = JSON.parse(cleanJson(text)) as Partial<ImageReviewResult>;
    return {
      isRelevant: parsed.isRelevant === true,
      isFresh: parsed.isFresh === true,
      notes: String(parsed.notes ?? "").slice(0, 120),
    };
  } catch {
    return {
      isRelevant: false,
      isFresh: false,
      notes: "Invalid AI review response",
    };
  }
};

export const reviewChallengeImage = async (imageUrl: string): Promise<ImageReviewResult> => {
  if (!client) {
    throw new Error("OpenAI API key is not configured");
  }

  const prompt =
    "Review this challenge photo for a farming app. Return only compact JSON with keys isRelevant, isFresh, notes. " +
    "isRelevant is true when the photo is related to crops, soil, farming, garden, field, plant treatment, or before/after plant care. " +
    "isFresh is true when it appears to be a real-world camera photo rather than a screenshot, web image, poster, drawing, meme, or AI-generated image. " +
    "Be reasonably confident before rejecting low-quality, blurry, resized, or older-phone photos. Keep notes under 20 words.";

  try {
    const response = await client.responses.create(
      {
        model: env.OPENAI_MODEL_NAME,
        temperature: 0,
        max_output_tokens: 120,
        text: {
          format: {
            type: "json_object",
          },
        },
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: imageUrl, detail: "low" },
            ],
          },
        ],
      },
      { timeout: 15000 },
    );

    return parseReview(response.output_text.trim());
  } catch (error) {
    console.error("OpenAI image review failed", { imageUrl, error });
    throw error;
  }
};

export const reviewChallengeImagePass = async (imageUrl: string): Promise<boolean> => {
  const review = await reviewChallengeImage(imageUrl);
  return review.isRelevant && review.isFresh;
};
