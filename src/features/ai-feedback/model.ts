export const FEEDBACK_SCHEMA_VERSION = "1" as const;

export const FEEDBACK_REASON_CODES = [
  "NORMAL_JOURNAL_CONTENT",
  "EXPLICIT_IMMEDIATE_SELF_HARM",
  "EXPLICIT_IMMEDIATE_HARM_TO_OTHERS",
  "ACUTE_DANGER",
  "AMBIGUOUS_HIGH_DISTRESS",
  "CLASSIFICATION_UNCERTAIN",
  "PROVIDER_NOT_CONFIGURED",
  "PROVIDER_TIMEOUT",
  "PROVIDER_BLOCKED",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_RATE_LIMITED",
  "PROVIDER_ERROR",
  "PROVIDER_OUTPUT_INVALID",
  "PROVIDER_OUTPUT_UNSAFE",
] as const;

export type FeedbackReasonCode = (typeof FEEDBACK_REASON_CODES)[number];

export type FeedbackPolicyDecision =
  | "allow_generation"
  | "supportive_redirect"
  | "crisis_redirect"
  | "safe_fallback";

export type FeedbackStatus =
  | "generated"
  | "supportive_redirect"
  | "crisis_redirect"
  | "safe_fallback";

export interface FeedbackResult {
  disclaimer: string;
  policyDecision: FeedbackPolicyDecision;
  reasonCodes: FeedbackReasonCode[];
  reflection: string;
  schemaVersion: typeof FEEDBACK_SCHEMA_VERSION;
  status: FeedbackStatus;
  suggestions: string[];
}
