import { z } from "zod";

import { RECENT_TREND_DAYS } from "@/features/trends/model";

export const recentTrendsQuerySchema = z
  .object({
    days: z.coerce
      .number()
      .int()
      .min(RECENT_TREND_DAYS)
      .max(RECENT_TREND_DAYS)
      .default(RECENT_TREND_DAYS),
  })
  .strict();

export type RecentTrendsQuery = z.infer<typeof recentTrendsQuerySchema>;
