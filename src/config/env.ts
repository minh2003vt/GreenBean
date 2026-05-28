import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  JWT_KEY: z.string().min(32),
  JWT_ISSUER: z.string().default("GreenBean"),
  JWT_AUDIENCE: z.string().default("GreenBeanUser"),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  RAILWAY_PUBLIC_DOMAIN: z.string().optional(),
  BREVO_API_KEY: z.string().optional(),
  MAIL_SENDER_EMAIL: z.string().email().optional(),
  MAIL_SENDER_NAME: z.string().default("GreenBean"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL_NAME: z.string().default("gpt-4.1-mini"),
  OPENAI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.2),
  OPENAI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(300),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_BASE_URL: z.string().url().default("https://api-m.sandbox.paypal.com"),
  NODE_TLS_REJECT_UNAUTHORIZED: z.string().optional(),
});

export const env = envSchema.parse(process.env);
