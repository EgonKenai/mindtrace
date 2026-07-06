import type {
  LongTermSummary,
  LongTermSummaryTag,
  LongTermSummaryWindow,
} from "@/features/long-term/model";
import type { JournalEventTagId } from "@/features/journal/model";
import type { AppLocale } from "@/i18n/config";
import { longTermSummaryQuerySchema } from "@/lib/validation/long-term";
import {
  listJournalSummaryRecords,
  type JournalSummaryRecord,
} from "@/server/repositories/journal-repository";
import { requireProductDataAccess } from "@/server/services/product-access-service";
import { buildRecentLocalDates } from "@/server/trends/aggregation";

const SUMMARY_SCHEMA_VERSION = 1;
const MAX_COMMON_TAGS = 5;
const NOTABLE_PATTERN_MESSAGES: Record<
  AppLocale,
  {
    default: string;
    highMood: string;
    highStress: string;
    manyMissingDays: string;
    shortSleep: string;
  }
> = {
  "zh-CN": {
    default: "当前摘要没有显示明显集中趋势，可以把它作为低风险回顾参考。",
    highMood: "最近记录里的心情评分整体可能比较稳定或偏高。",
    highStress: "最近记录里的压力评分看起来偏高，可以作为后续观察的信号。",
    manyMissingDays: "这个窗口内缺失日期较多，摘要只适合作为很粗略的回顾。",
    shortSleep:
      "最近记录里的睡眠时长可能偏短，可以继续观察它和白天状态的关系。",
  },
  en: {
    default:
      "This summary does not show a clear concentrated pattern yet. You can use it as a low-risk reflection reference.",
    highMood:
      "Recent mood scores may look relatively stable or on the higher side.",
    highStress:
      "Recent stress scores may look on the higher side. You can keep observing this as a signal.",
    manyMissingDays:
      "This window has many missing dates, so the summary is best used as a very rough review.",
    shortSleep:
      "Recent sleep duration may be on the shorter side. You can keep observing how it relates to daytime state.",
  },
};

function roundAverage(total: number, count: number): number {
  return Math.round((total / count) * 100) / 100;
}

function averageMetric(
  records: JournalSummaryRecord[],
  metric: "energy" | "mood" | "sleepHours" | "sleepQuality" | "stress",
): number | null {
  if (records.length === 0) {
    return null;
  }

  return roundAverage(
    records.reduce((total, record) => total + record[metric], 0),
    records.length,
  );
}

function getMissingDays(
  localDates: string[],
  records: JournalSummaryRecord[],
): string[] {
  const recordedDates = new Set(records.map((record) => record.localDate));
  return localDates.filter((localDate) => !recordedDates.has(localDate));
}

function getMostCommonTags(
  records: JournalSummaryRecord[],
): LongTermSummaryTag[] {
  const counts = new Map<JournalEventTagId, number>();

  for (const record of records) {
    for (const tag of record.eventTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort(([leftTag, leftCount], [rightTag, rightCount]) => {
      if (rightCount !== leftCount) {
        return rightCount - leftCount;
      }

      return leftTag.localeCompare(rightTag);
    })
    .slice(0, MAX_COMMON_TAGS)
    .map(([tag, count]) => ({ count, tag }));
}

function buildNotablePatterns(input: {
  entryCount: number;
  locale: AppLocale;
  missingDays: string[];
  moodAverage: number | null;
  sleepAverage: number | null;
  stressAverage: number | null;
  summaryWindow: LongTermSummaryWindow;
}): string[] {
  if (input.entryCount === 0) {
    return [];
  }

  const messages = NOTABLE_PATTERN_MESSAGES[input.locale];
  const patterns: string[] = [];

  if (input.stressAverage !== null && input.stressAverage >= 7) {
    patterns.push(messages.highStress);
  }

  if (input.moodAverage !== null && input.moodAverage >= 7) {
    patterns.push(messages.highMood);
  }

  if (input.sleepAverage !== null && input.sleepAverage < 6) {
    patterns.push(messages.shortSleep);
  }

  if (input.missingDays.length > Math.floor(input.summaryWindow / 2)) {
    patterns.push(messages.manyMissingDays);
  }

  if (patterns.length === 0) {
    patterns.push(messages.default);
  }

  return patterns;
}

export async function getLongTermSummary(
  userId: string | null | undefined,
  query: unknown,
  now = new Date(),
): Promise<LongTermSummary> {
  const context = await requireProductDataAccess(userId);
  const parsed = longTermSummaryQuerySchema.parse(query);
  const localDates = buildRecentLocalDates(
    now,
    context.timeZone,
    parsed.window,
  );
  const startDate = localDates[0];
  const endDate = localDates[localDates.length - 1];
  const records = await listJournalSummaryRecords(
    context.userId,
    startDate,
    endDate,
  );
  const entryCount = records.length;
  const missingDays = getMissingDays(localDates, records);
  const moodAverage = averageMetric(records, "mood");
  const stressAverage = averageMetric(records, "stress");
  const energyAverage = averageMetric(records, "energy");
  const sleepAverage = averageMetric(records, "sleepHours");
  const sleepQualityAverage = averageMetric(records, "sleepQuality");

  return {
    endDate,
    energyAverage,
    entryCount,
    generatedAt: now.toISOString(),
    missingDays,
    moodAverage,
    mostCommonTags: getMostCommonTags(records),
    notablePatterns: buildNotablePatterns({
      entryCount,
      locale: parsed.locale,
      missingDays,
      moodAverage,
      sleepAverage,
      stressAverage,
      summaryWindow: parsed.window,
    }),
    schemaVersion: SUMMARY_SCHEMA_VERSION,
    sleepAverage,
    sleepQualityAverage,
    startDate,
    status: entryCount > 0 ? "ready" : "insufficient_data",
    stressAverage,
    summaryWindow: parsed.window,
    timeZone: context.timeZone,
  };
}
