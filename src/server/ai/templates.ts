import type {
  FeedbackPolicyDecision,
  FeedbackResult,
  FeedbackStatus,
} from "@/features/ai-feedback/model";
import { FEEDBACK_SCHEMA_VERSION } from "@/features/ai-feedback/model";
import type { FeedbackReasonCode } from "@/lib/validation/ai-feedback";
import { feedbackResultSchema } from "@/lib/validation/ai-feedback";
import { zhCN } from "@/i18n/messages/zh-CN";

interface FixedFeedbackInput {
  decision: FeedbackPolicyDecision;
  reasonCodes: FeedbackReasonCode[];
  reflection: string;
  status: FeedbackStatus;
  suggestions: readonly string[];
}

function createFixedFeedback(input: FixedFeedbackInput): FeedbackResult {
  return feedbackResultSchema.parse({
    schemaVersion: FEEDBACK_SCHEMA_VERSION,
    status: input.status,
    reflection: input.reflection,
    suggestions: [...input.suggestions],
    disclaimer: zhCN.aiFeedback.disclaimer,
    policyDecision: input.decision,
    reasonCodes: input.reasonCodes,
  });
}

export function createCrisisRedirectFeedback(
  reasonCodes: FeedbackReasonCode[],
): FeedbackResult {
  return createFixedFeedback({
    decision: "crisis_redirect",
    reasonCodes,
    reflection: zhCN.aiFeedback.crisis.reflection,
    status: "crisis_redirect",
    suggestions: zhCN.aiFeedback.crisis.suggestions,
  });
}

export function createSupportiveRedirectFeedback(
  reasonCodes: FeedbackReasonCode[],
): FeedbackResult {
  return createFixedFeedback({
    decision: "supportive_redirect",
    reasonCodes,
    reflection: zhCN.aiFeedback.supportive.reflection,
    status: "supportive_redirect",
    suggestions: zhCN.aiFeedback.supportive.suggestions,
  });
}

export function createSafeFallbackFeedback(
  reasonCodes: FeedbackReasonCode[],
): FeedbackResult {
  return createFixedFeedback({
    decision: "safe_fallback",
    reasonCodes,
    reflection: zhCN.aiFeedback.generated.fallbackReflection,
    status: "safe_fallback",
    suggestions: [],
  });
}
