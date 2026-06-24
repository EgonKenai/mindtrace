export const RECENT_TREND_DAYS = 7;

export const TREND_METRIC_IDS = [
  "mood",
  "stress",
  "energy",
  "sleepHours",
  "sleepQuality",
] as const;

export type TrendMetricId = (typeof TREND_METRIC_IDS)[number];

export interface DailyTrendPoint {
  energy: number | null;
  entryCount: number;
  localDate: string;
  mood: number | null;
  sleepHours: number | null;
  sleepQuality: number | null;
  stress: number | null;
}

export interface RecentTrends {
  days: number;
  endDate: string;
  points: DailyTrendPoint[];
  startDate: string;
  timeZone: string;
  totalEntries: number;
}

export interface TrendsApiErrorPayload {
  error?: {
    code?: string;
  };
}
