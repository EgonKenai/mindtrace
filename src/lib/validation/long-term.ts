import { z } from "zod";

import { defaultLocale, supportedLocales } from "@/i18n/config";

export const longTermSummaryQuerySchema = z
  .object({
    locale: z.enum(supportedLocales).default(defaultLocale),
    window: z.coerce
      .number()
      .pipe(z.union([z.literal(7), z.literal(14), z.literal(30)]))
      .default(7),
  })
  .strict();

export type LongTermSummaryQuery = z.infer<typeof longTermSummaryQuerySchema>;
