import type { JournalEventTagId } from "@/features/journal/model";

export const LONG_TERM_SUMMARY_WINDOWS = [7, 14, 30] as const;

export type LongTermSummaryWindow = (typeof LONG_TERM_SUMMARY_WINDOWS)[number];

export type LongTermSummaryStatus = "ready" | "insufficient_data";

export interface LongTermSummaryTag {
  count: number;
  tag: JournalEventTagId;
}

export interface LongTermSummary {
  endDate: string;
  energyAverage: number | null;
  entryCount: number;
  generatedAt: string;
  missingDays: string[];
  moodAverage: number | null;
  mostCommonTags: LongTermSummaryTag[];
  notablePatterns: string[];
  schemaVersion: 1;
  sleepAverage: number | null;
  sleepQualityAverage: number | null;
  startDate: string;
  status: LongTermSummaryStatus;
  stressAverage: number | null;
  summaryWindow: LongTermSummaryWindow;
  timeZone: string;
}

export interface LongTermSummaryApiErrorPayload {
  error?: {
    code?: string;
  };
}
