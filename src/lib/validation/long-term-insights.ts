import { z } from "zod";

import {
  JOURNAL_EVENT_TAG_IDS,
  JOURNAL_MAX_EVENT_TAGS,
} from "@/features/journal/model";
import {
  LONG_TERM_INSIGHT_ACTION_TYPES,
  LONG_TERM_INSIGHT_STATUSES,
  LONG_TERM_SUMMARY_WINDOWS,
} from "@/features/long-term/model";
import { defaultLocale, supportedLocales } from "@/i18n/config";

const linkedTagsSchema = z
  .array(z.enum(JOURNAL_EVENT_TAG_IDS))
  .max(JOURNAL_MAX_EVENT_TAGS)
  .refine((tags) => new Set(tags).size === tags.length);

const summaryWindowSchema = z
  .union([z.literal(7), z.literal(14), z.literal(30)])
  .or(z.enum(["7", "14", "30"]).transform((value) => Number(value)))
  .transform((value) => value as (typeof LONG_TERM_SUMMARY_WINDOWS)[number]);

export const longTermInsightRequestSchema = z
  .object({
    locale: z.enum(supportedLocales).default(defaultLocale),
    summaryWindow: summaryWindowSchema,
  })
  .strict();

export const longTermInsightPatternSchema = z
  .object({
    confidence: z.enum(["low", "medium"]),
    description: z.string().min(1).max(800),
    relatedTags: linkedTagsSchema.default([]),
    title: z.string().min(1).max(120),
  })
  .strict();

export const longTermInsightGentleSuggestionSchema = z
  .object({
    description: z.string().min(1).max(600),
    riskLevel: z.literal("low"),
    suggestedActionType: z.enum(LONG_TERM_INSIGHT_ACTION_TYPES),
    title: z.string().min(1).max(120),
  })
  .strict();

export const providerLongTermInsightOutputSchema = z
  .object({
    gentleSuggestions: z
      .array(longTermInsightGentleSuggestionSchema)
      .min(1)
      .max(3),
    overview: z.string().min(1).max(1_000),
    patterns: z.array(longTermInsightPatternSchema).min(1).max(5),
    planSuggestionRefs: z.array(z.string().min(1).max(128)).max(5).default([]),
    strengths: z.array(z.string().min(1).max(300)).max(5).default([]),
    title: z.string().min(1).max(140),
    watchPoints: z.array(z.string().min(1).max(300)).max(5).default([]),
  })
  .strict();

export const longTermInsightDraftSchema = providerLongTermInsightOutputSchema
  .extend({
    endDate: z.string(),
    generatedAt: z.string(),
    id: z.string(),
    safetyLabel: z.enum(["low_risk", "safe_fallback"]),
    schemaVersion: z.literal(1),
    sourceSummarySnapshot: z
      .object({
        endDate: z.string(),
        energyAverage: z.number().nullable(),
        entryCount: z.number().int().min(0),
        missingDays: z.array(z.string()),
        moodAverage: z.number().nullable(),
        mostCommonTags: z.array(
          z.object({
            count: z.number().int().min(1),
            tag: z.enum(JOURNAL_EVENT_TAG_IDS),
          }),
        ),
        notablePatterns: z.array(z.string()),
        sleepAverage: z.number().nullable(),
        sleepQualityAverage: z.number().nullable(),
        startDate: z.string(),
        stressAverage: z.number().nullable(),
        summaryWindow: z.union([z.literal(7), z.literal(14), z.literal(30)]),
      })
      .strict(),
    startDate: z.string(),
    status: z.enum(LONG_TERM_INSIGHT_STATUSES),
    summaryWindow: z.union([z.literal(7), z.literal(14), z.literal(30)]),
    updatedAt: z.string(),
  })
  .strict();

export type LongTermInsightRequest = z.infer<
  typeof longTermInsightRequestSchema
>;
export type ProviderLongTermInsightOutput = z.infer<
  typeof providerLongTermInsightOutputSchema
>;
