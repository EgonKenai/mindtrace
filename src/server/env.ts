import { z } from "zod";

const serverEnvSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1).default("mindtrace-demo"),
  APP_ORIGIN: z.url().default("http://localhost:3000"),
  GEMINI_API_KEY: z.string().trim().min(1).optional(),
  GEMINI_MODEL: z.string().trim().min(1).optional(),
  GEMINI_PROVIDER_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(60_000)
    .default(30_000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    FIREBASE_PROJECT_ID:
      process.env.FIREBASE_PROJECT_ID ??
      process.env.GCLOUD_PROJECT ??
      "mindtrace-demo",
    APP_ORIGIN: process.env.APP_ORIGIN ?? "http://localhost:3000",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
    GEMINI_MODEL: process.env.GEMINI_MODEL || undefined,
    GEMINI_PROVIDER_TIMEOUT_MS:
      process.env.GEMINI_PROVIDER_TIMEOUT_MS || undefined,
    NODE_ENV: process.env.NODE_ENV ?? "development",
  });
}
