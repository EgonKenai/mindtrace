import { z } from "zod";

import { supportedLocales } from "@/i18n/config";

function isValidTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const consentSubmissionSchema = z.object({
  adultConfirmed: z.literal(true),
  productBoundaryAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  aiProcessingAccepted: z.boolean(),
  locale: z.enum(supportedLocales),
  timeZone: z.string().min(1).max(100).refine(isValidTimeZone),
});

export const aiProcessingConsentSchema = z
  .object({
    accepted: z.boolean(),
    locale: z.enum(supportedLocales),
  })
  .strict();

export type ConsentSubmission = z.infer<typeof consentSubmissionSchema>;
export type AiProcessingConsentSubmission = z.infer<
  typeof aiProcessingConsentSchema
>;
