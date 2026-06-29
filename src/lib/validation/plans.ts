import { z } from "zod";

import {
  PLAN_ACTION_STATUSES,
  PLAN_CHECK_IN_FREQUENCIES,
  PLAN_STATUSES,
} from "@/features/plans/model";
import {
  JOURNAL_EVENT_TAG_IDS,
  JOURNAL_MAX_EVENT_TAGS,
} from "@/features/journal/model";

const localDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function isValidLocalDate(value: string): boolean {
  const match = localDatePattern.exec(value);

  if (!match) {
    return false;
  }

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  );
}

const localDateSchema = z.string().refine(isValidLocalDate);

const linkedTagsSchema = z
  .array(z.enum(JOURNAL_EVENT_TAG_IDS))
  .max(JOURNAL_MAX_EVENT_TAGS)
  .refine((tags) => new Set(tags).size === tags.length);

export const createPlanInputSchema = z
  .object({
    checkInFrequency: z.enum(PLAN_CHECK_IN_FREQUENCIES).default("none"),
    description: z.string().max(1000).default(""),
    linkedTags: linkedTagsSchema.default([]),
    sourceType: z.literal("manual").default("manual"),
    startDate: localDateSchema,
    targetDate: localDateSchema.nullish().transform((value) => value ?? null),
    title: z.string().min(1).max(120),
  })
  .strict();

export const updatePlanInputSchema = z
  .object({
    checkInFrequency: z.enum(PLAN_CHECK_IN_FREQUENCIES).optional(),
    description: z.string().max(1000).optional(),
    linkedTags: linkedTagsSchema.optional(),
    startDate: localDateSchema.optional(),
    status: z.enum(PLAN_STATUSES).optional(),
    targetDate: localDateSchema.nullable().optional(),
    title: z.string().min(1).max(120).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

export const createPlanActionInputSchema = z
  .object({
    description: z.string().max(1000).default(""),
    dueDate: localDateSchema.nullish().transform((value) => value ?? null),
    title: z.string().min(1).max(120),
  })
  .strict();

export const updatePlanActionInputSchema = z
  .object({
    description: z.string().max(1000).optional(),
    dueDate: localDateSchema.nullable().optional(),
    status: z.enum(PLAN_ACTION_STATUSES).optional(),
    title: z.string().min(1).max(120).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

export type CreatePlanInput = z.infer<typeof createPlanInputSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanInputSchema>;
export type CreatePlanActionInput = z.infer<typeof createPlanActionInputSchema>;
export type UpdatePlanActionInput = z.infer<typeof updatePlanActionInputSchema>;
