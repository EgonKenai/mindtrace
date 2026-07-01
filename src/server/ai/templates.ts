import type {
  FeedbackPolicyDecision,
  FeedbackResult,
  FeedbackStatus,
} from "@/features/ai-feedback/model";
import { FEEDBACK_SCHEMA_VERSION } from "@/features/ai-feedback/model";
import type { FeedbackReasonCode } from "@/lib/validation/ai-feedback";
import { feedbackResultSchema } from "@/lib/validation/ai-feedback";
import type { AppLocale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

interface FixedFeedbackInput {
  decision: FeedbackPolicyDecision;
  locale: AppLocale;
  reasonCodes: FeedbackReasonCode[];
  reflection: string;
  status: FeedbackStatus;
  suggestions: readonly string[];
}

function createFixedFeedback(input: FixedFeedbackInput): FeedbackResult {
  const messages = getMessages(input.locale);

  return feedbackResultSchema.parse({
    schemaVersion: FEEDBACK_SCHEMA_VERSION,
    status: input.status,
    reflection: input.reflection,
    suggestions: [...input.suggestions],
    disclaimer: messages.aiFeedback.disclaimer,
    policyDecision: input.decision,
    reasonCodes: input.reasonCodes,
  });
}

export function createCrisisRedirectFeedback(
  reasonCodes: FeedbackReasonCode[],
  locale: AppLocale = defaultLocale,
): FeedbackResult {
  const messages = getMessages(locale);

  return createFixedFeedback({
    decision: "crisis_redirect",
    locale,
    reasonCodes,
    reflection: messages.aiFeedback.crisis.reflection,
    status: "crisis_redirect",
    suggestions: messages.aiFeedback.crisis.suggestions,
  });
}

export function createSupportiveRedirectFeedback(
  reasonCodes: FeedbackReasonCode[],
  locale: AppLocale = defaultLocale,
): FeedbackResult {
  const messages = getMessages(locale);

  return createFixedFeedback({
    decision: "supportive_redirect",
    locale,
    reasonCodes,
    reflection: messages.aiFeedback.supportive.reflection,
    status: "supportive_redirect",
    suggestions: messages.aiFeedback.supportive.suggestions,
  });
}

export function createSafeFallbackFeedback(
  reasonCodes: FeedbackReasonCode[],
  locale: AppLocale = defaultLocale,
): FeedbackResult {
  const messages = getMessages(locale);

  return createFixedFeedback({
    decision: "safe_fallback",
    locale,
    reasonCodes,
    reflection: messages.aiFeedback.generated.fallbackReflection,
    status: "safe_fallback",
    suggestions: [],
  });
}
