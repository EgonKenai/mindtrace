import type { JournalEventTagId } from "@/features/journal/model";

export const LONG_TERM_SUMMARY_WINDOWS = [7, 14, 30] as const;
export const LONG_TERM_INSIGHT_STATUSES = [
  "draft",
  "saved",
  "dismissed",
] as const;
export const LONG_TERM_INSIGHT_ACTION_TYPES = [
  "rest",
  "reflection",
  "planning",
  "routine",
  "social",
  "learning",
  "other",
] as const;

export type LongTermSummaryWindow = (typeof LONG_TERM_SUMMARY_WINDOWS)[number];

export type LongTermSummaryStatus = "ready" | "insufficient_data";
export type LongTermInsightStatus = (typeof LONG_TERM_INSIGHT_STATUSES)[number];
export type LongTermInsightConfidence = "low" | "medium";
export type LongTermInsightSuggestionActionType =
  (typeof LONG_TERM_INSIGHT_ACTION_TYPES)[number];
export type LongTermInsightSafetyLabel = "low_risk" | "safe_fallback";
export type LongTermInsightGenerationStatus =
  | "generated"
  | "insufficient_data"
  | "safe_fallback";
export type LongTermInsightReasonCode =
  | "NORMAL_SUMMARY_CONTENT"
  | "INSUFFICIENT_DATA"
  | "CRISIS_OR_HIGH_RISK_SIGNAL"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_BLOCKED"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_ERROR"
  | "PROVIDER_OUTPUT_INVALID"
  | "PROVIDER_OUTPUT_UNSAFE";

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

export type LongTermInsightSummarySnapshot = Pick<
  LongTermSummary,
  | "endDate"
  | "energyAverage"
  | "entryCount"
  | "missingDays"
  | "moodAverage"
  | "mostCommonTags"
  | "notablePatterns"
  | "sleepAverage"
  | "sleepQualityAverage"
  | "startDate"
  | "stressAverage"
  | "summaryWindow"
>;

export interface LongTermInsightPattern {
  confidence: LongTermInsightConfidence;
  description: string;
  relatedTags: JournalEventTagId[];
  title: string;
}

export interface LongTermInsightGentleSuggestion {
  description: string;
  riskLevel: "low";
  suggestedActionType: LongTermInsightSuggestionActionType;
  title: string;
}

export interface LongTermInsightDraft {
  endDate: string;
  generatedAt: string;
  gentleSuggestions: LongTermInsightGentleSuggestion[];
  id: string;
  overview: string;
  patterns: LongTermInsightPattern[];
  planSuggestionRefs: string[];
  safetyLabel: LongTermInsightSafetyLabel;
  schemaVersion: 1;
  sourceSummarySnapshot: LongTermInsightSummarySnapshot;
  startDate: string;
  status: LongTermInsightStatus;
  strengths: string[];
  summaryWindow: LongTermSummaryWindow;
  title: string;
  updatedAt: string;
  watchPoints: string[];
}

export interface LongTermInsightGenerationResult {
  insight: LongTermInsightDraft | null;
  reasonCodes: LongTermInsightReasonCode[];
  status: LongTermInsightGenerationStatus;
}

export interface LongTermSummaryApiErrorPayload {
  error?: {
    fields?: Partial<Record<"insightId" | "summaryWindow" | "window", string>>;
    code?: string;
  };
}
