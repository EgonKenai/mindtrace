import type { JournalEventTagId } from "@/features/journal/model";

export const PLAN_STATUSES = [
  "active",
  "completed",
  "paused",
  "abandoned",
] as const;
export const PLAN_ACTION_STATUSES = ["todo", "done", "skipped"] as const;
export const PLAN_CHECK_IN_FREQUENCIES = ["none", "daily", "weekly"] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];
export type PlanActionStatus = (typeof PLAN_ACTION_STATUSES)[number];
export type PlanCheckInFrequency = (typeof PLAN_CHECK_IN_FREQUENCIES)[number];
export type PlanSourceType = "manual" | "ai_suggested";

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
  | "dueDate";

export interface PlanApiErrorPayload {
  error?: {
    code?: string;
    fields?: Partial<Record<PlanFieldName, string>>;
  };
}
