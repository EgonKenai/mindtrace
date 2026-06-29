import type {
  FeedbackReasonCode,
  FeedbackResult,
} from "@/features/ai-feedback/model";

export type FeedbackFallbackKind =
  | "not-configured"
  | "timeout"
  | "rate-limited"
  | "unavailable"
  | "blocked"
  | "invalid"
  | "generic";

const FALLBACK_REASON_PRIORITY: ReadonlyArray<
  readonly [FeedbackReasonCode, FeedbackFallbackKind]
> = [
  ["PROVIDER_NOT_CONFIGURED", "not-configured"],
  ["PROVIDER_TIMEOUT", "timeout"],
  ["PROVIDER_RATE_LIMITED", "rate-limited"],
  ["PROVIDER_UNAVAILABLE", "unavailable"],
  ["PROVIDER_BLOCKED", "blocked"],
  ["PROVIDER_OUTPUT_INVALID", "invalid"],
  ["PROVIDER_OUTPUT_UNSAFE", "invalid"],
];

export function getFeedbackFallbackKind(
  reasonCodes: readonly FeedbackReasonCode[],
): FeedbackFallbackKind {
  for (const [reasonCode, kind] of FALLBACK_REASON_PRIORITY) {
    if (reasonCodes.includes(reasonCode)) {
      return kind;
    }
  }

  return "generic";
}

export function isSafetyRedirect(result: FeedbackResult): boolean {
  return (
    result.status === "crisis_redirect" ||
    result.status === "supportive_redirect"
  );
}
