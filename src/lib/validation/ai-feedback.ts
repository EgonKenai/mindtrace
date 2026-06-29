import { z } from "zod";

import {
  FEEDBACK_REASON_CODES,
  FEEDBACK_SCHEMA_VERSION,
  type FeedbackReasonCode,
} from "@/features/ai-feedback/model";

export const MAX_FEEDBACK_REFLECTION_CHARACTERS = 600;
export const MAX_FEEDBACK_SUGGESTION_CHARACTERS = 240;
export const MAX_FEEDBACK_SUGGESTIONS = 3;
export const MAX_GENERATED_SUGGESTIONS = 1;

const nonBlankText = (maximum: number) =>
  z
    .string()
    .trim()
    .min(1)
    .refine((value) => Array.from(value).length <= maximum);

export const feedbackPolicyDecisionSchema = z.enum([
  "allow_generation",
  "supportive_redirect",
  "crisis_redirect",
  "safe_fallback",
]);

export const feedbackReasonCodeSchema = z.enum(FEEDBACK_REASON_CODES);

export const providerOutputSchema = z
  .object({
    reflection: nonBlankText(MAX_FEEDBACK_REFLECTION_CHARACTERS),
    suggestions: z
      .array(nonBlankText(MAX_FEEDBACK_SUGGESTION_CHARACTERS))
      .max(MAX_GENERATED_SUGGESTIONS),
  })
  .strict();

export const feedbackResultSchema = z
  .object({
    schemaVersion: z.literal(FEEDBACK_SCHEMA_VERSION),
    status: z.enum([
      "generated",
      "supportive_redirect",
      "crisis_redirect",
      "safe_fallback",
    ]),
    reflection: nonBlankText(MAX_FEEDBACK_REFLECTION_CHARACTERS),
    suggestions: z
      .array(nonBlankText(MAX_FEEDBACK_SUGGESTION_CHARACTERS))
      .max(MAX_FEEDBACK_SUGGESTIONS),
    disclaimer: nonBlankText(300),
    policyDecision: feedbackPolicyDecisionSchema,
    reasonCodes: z.array(feedbackReasonCodeSchema).min(1).max(8),
  })
  .strict();

export type { FeedbackReasonCode };
export type ValidatedProviderOutput = z.infer<typeof providerOutputSchema>;
