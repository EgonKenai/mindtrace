import { z } from "zod";

const serverEnvSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1).default("mindtrace-demo"),
  APP_ORIGIN: z.url().default("http://localhost:3000"),
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
    NODE_ENV: process.env.NODE_ENV ?? "development",
  });
}
