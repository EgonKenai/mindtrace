import { z } from "zod";

import { supportedLocales } from "@/i18n/config";

export const MAX_DEMO_REFLECTION_NOTE_CHARACTERS = 1200;

export const demoReflectionRequestSchema = z
  .object({
    locale: z.enum(supportedLocales).default("en"),
    note: z
      .string()
      .trim()
      .min(1)
      .refine(
        (value) =>
          Array.from(value).length <= MAX_DEMO_REFLECTION_NOTE_CHARACTERS,
      ),
  })
  .strict();

export type DemoReflectionRequest = z.infer<typeof demoReflectionRequestSchema>;
