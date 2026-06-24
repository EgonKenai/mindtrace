import type { DailyTrendPoint, TrendMetricId } from "@/features/trends/model";
import { TREND_METRIC_IDS } from "@/features/trends/model";
import { getLocalDateForTimeZone } from "@/lib/validation/journal";
import type { JournalTrendRecord } from "@/server/repositories/journal-repository";

const localDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function shiftLocalDate(localDate: string, days: number): string {
  const match = localDatePattern.exec(localDate);

  if (!match) {
    throw new Error("INVALID_LOCAL_DATE");
  }

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

export function buildRecentLocalDates(
  now: Date,
  timeZone: string,
  days: number,
): string[] {
  const endDate = getLocalDateForTimeZone(now, timeZone);

  return Array.from({ length: days }, (_, index) =>
    shiftLocalDate(endDate, index - days + 1),
  );
}

function roundAverage(total: number, count: number): number {
  return Math.round((total / count) * 100) / 100;
}

export function aggregateJournalTrends(
  localDates: string[],
  records: JournalTrendRecord[],
): DailyTrendPoint[] {
  const totals = new Map<
    string,
    { count: number; values: Record<TrendMetricId, number> }
  >();

  for (const record of records) {
    if (!localDates.includes(record.localDate)) {
      continue;
    }

    const current = totals.get(record.localDate) ?? {
      count: 0,
      values: {
        mood: 0,
        stress: 0,
        energy: 0,
        sleepHours: 0,
        sleepQuality: 0,
      },
    };

    current.count += 1;
    for (const metric of TREND_METRIC_IDS) {
      current.values[metric] += record[metric];
    }
    totals.set(record.localDate, current);
  }

  return localDates.map((localDate) => {
    const dailyTotals = totals.get(localDate);

    if (!dailyTotals) {
      return {
        localDate,
        entryCount: 0,
        mood: null,
        stress: null,
        energy: null,
        sleepHours: null,
        sleepQuality: null,
      };
    }

    return {
      localDate,
      entryCount: dailyTotals.count,
      mood: roundAverage(dailyTotals.values.mood, dailyTotals.count),
      stress: roundAverage(dailyTotals.values.stress, dailyTotals.count),
      energy: roundAverage(dailyTotals.values.energy, dailyTotals.count),
      sleepHours: roundAverage(
        dailyTotals.values.sleepHours,
        dailyTotals.count,
      ),
      sleepQuality: roundAverage(
        dailyTotals.values.sleepQuality,
        dailyTotals.count,
      ),
    };
  });
}
