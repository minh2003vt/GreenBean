import { ApiError } from "../middleware/error-handler.js";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export const uploadToCloudinary = async (file: string, folder = "greenbean") => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new ApiError(500, "Cloudinary settings are missing");
  }

  try {
    return await cloudinary.uploader.upload(file, {
      folder,
      resource_type: "auto",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cloudinary upload failed";
    throw new ApiError(502, `Cloudinary upload failed: ${message}`);
  }
};
