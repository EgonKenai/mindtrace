import type { JournalEventTagId } from "@/features/journal/model";

export const PLAN_STATUSES = [
  "active",
  "completed",
  "paused",
  "abandoned",
] as const;
export const PLAN_ACTION_STATUSES = ["todo", "done", "skipped"] as const;
export const PLAN_CHECK_IN_FREQUENCIES = ["none", "daily", "weekly"] as const;
export const PLAN_SUGGESTION_STATUSES = [
  "draft",
  "accepted",
  "dismissed",
] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];
export type PlanActionStatus = (typeof PLAN_ACTION_STATUSES)[number];
export type PlanCheckInFrequency = (typeof PLAN_CHECK_IN_FREQUENCIES)[number];
export type PlanSourceType = "manual" | "ai_suggested";
export type PlanSuggestionStatus = (typeof PLAN_SUGGESTION_STATUSES)[number];
export type PlanSuggestionSafetyLabel = "low_risk" | "safe_fallback";
export type PlanSuggestionGenerationStatus =
  | "generated"
  | "insufficient_data"
  | "safe_fallback";
export type PlanSuggestionReasonCode =
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

export interface PlanAction {
  completedAt: string | null;
  createdAt: string;
  description: string;
  dueDate: string | null;
  id: string;
  planId: string;
  schemaVersion: 1;
  status: PlanActionStatus;
  title: string;
  updatedAt: string;
}

export interface ActionPlan {
  actions: PlanAction[];
  checkInFrequency: PlanCheckInFrequency;
  createdAt: string;
  description: string;
  id: string;
  linkedTags: JournalEventTagId[];
  schemaVersion: 1;
  sourceType: PlanSourceType;
  startDate: string;
  status: PlanStatus;
  targetDate: string | null;
  title: string;
  updatedAt: string;
}

export interface PlanSuggestionAction {
  description: string;
  linkedTags: JournalEventTagId[];
  suggestedDueInDays: number;
  title: string;
}

export interface PlanSuggestionDraft {
  description: string;
  endDate: string;
  generatedAt: string;
  id: string;
  linkedTags: JournalEventTagId[];
  rationale: string;
  safetyLabel: PlanSuggestionSafetyLabel;
  schemaVersion: 1;
  startDate: string;
  status: PlanSuggestionStatus;
  suggestedActions: PlanSuggestionAction[];
  summaryWindow: 7 | 14 | 30;
  title: string;
}

export interface PlanSuggestionGenerationResult {
  reasonCodes: PlanSuggestionReasonCode[];
  status: PlanSuggestionGenerationStatus;
  suggestion: PlanSuggestionDraft | null;
}

export interface PlanList {
  plans: ActionPlan[];
}

export type PlanFieldName =
  | "title"
  | "description"
  | "status"
  | "startDate"
  | "targetDate"
  | "checkInFrequency"
  | "linkedTags"
  | "dueDate"
  | "summaryWindow"
  | "suggestionId";

export interface PlanApiErrorPayload {
  error?: {
    code?: string;
    fields?: Partial<Record<PlanFieldName, string>>;
  };
}
