import { z } from "zod";

import {
  JOURNAL_EVENT_TAG_IDS,
  JOURNAL_MAX_EVENT_TAGS,
} from "@/features/journal/model";
import { LONG_TERM_SUMMARY_WINDOWS } from "@/features/long-term/model";
import { PLAN_SUGGESTION_STATUSES } from "@/features/plans/model";

const linkedTagsSchema = z
  .array(z.enum(JOURNAL_EVENT_TAG_IDS))
  .max(JOURNAL_MAX_EVENT_TAGS)
  .refine((tags) => new Set(tags).size === tags.length);

export const planSuggestionRequestSchema = z
  .object({
    summaryWindow: z
      .union([z.literal(7), z.literal(14), z.literal(30)])
      .or(z.enum(["7", "14", "30"]).transform((value) => Number(value))),
  })
  .strict()
  .transform((value) => ({
    summaryWindow:
      value.summaryWindow as (typeof LONG_TERM_SUMMARY_WINDOWS)[number],
  }));

export const suggestedPlanActionSchema = z
  .object({
    description: z.string().max(500).default(""),
    linkedTags: linkedTagsSchema.default([]),
    suggestedDueInDays: z.number().int().min(0).max(90),
    title: z.string().min(1).max(120),
  })
  .strict();

export const providerPlanSuggestionOutputSchema = z
  .object({
    description: z.string().min(1).max(800),
    linkedTags: linkedTagsSchema.default([]),
    rationale: z.string().min(1).max(800),
    suggestedActions: z.array(suggestedPlanActionSchema).min(1).max(5),
    title: z.string().min(1).max(120),
  })
  .strict();

export const planSuggestionDraftSchema = providerPlanSuggestionOutputSchema
  .extend({
    endDate: z.string(),
    generatedAt: z.string(),
    id: z.string(),
    safetyLabel: z.enum(["low_risk", "safe_fallback"]),
    schemaVersion: z.literal(1),
    startDate: z.string(),
    status: z.enum(PLAN_SUGGESTION_STATUSES),
    summaryWindow: z.union([z.literal(7), z.literal(14), z.literal(30)]),
  })
  .strict();

export type PlanSuggestionRequest = z.infer<typeof planSuggestionRequestSchema>;
export type ProviderPlanSuggestionOutput = z.infer<
  typeof providerPlanSuggestionOutputSchema
>;
export type SuggestedPlanActionInput = z.infer<
  typeof suggestedPlanActionSchema
>;
