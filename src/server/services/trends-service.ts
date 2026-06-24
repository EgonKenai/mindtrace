import type { RecentTrends } from "@/features/trends/model";
import { recentTrendsQuerySchema } from "@/lib/validation/trends";
import { listJournalTrendRecords } from "@/server/repositories/journal-repository";
import { requireProductDataAccess } from "@/server/services/product-access-service";
import {
  aggregateJournalTrends,
  buildRecentLocalDates,
} from "@/server/trends/aggregation";

export async function getRecentTrends(
  userId: string | null | undefined,
  query: unknown,
  now = new Date(),
): Promise<RecentTrends> {
  const context = await requireProductDataAccess(userId);
  const { days } = recentTrendsQuerySchema.parse(query);
  const localDates = buildRecentLocalDates(now, context.timeZone, days);
  const startDate = localDates[0];
  const endDate = localDates[localDates.length - 1];
  const records = await listJournalTrendRecords(
    context.userId,
    startDate,
    endDate,
  );
  const points = aggregateJournalTrends(localDates, records);

  return {
    days,
    startDate,
    endDate,
    timeZone: context.timeZone,
    totalEntries: points.reduce((total, point) => total + point.entryCount, 0),
    points,
  };
}
