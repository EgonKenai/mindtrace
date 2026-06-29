import { z } from "zod";

export const longTermSummaryQuerySchema = z
  .object({
    window: z.coerce
      .number()
      .pipe(z.union([z.literal(7), z.literal(14), z.literal(30)]))
      .default(7),
  })
  .strict();

export type LongTermSummaryQuery = z.infer<typeof longTermSummaryQuerySchema>;
