import { describe, expect, it } from "vitest";

import type { FeedbackResult } from "@/features/ai-feedback/model";
import {
  getFeedbackFallbackKind,
  isSafetyRedirect,
} from "@/features/ai-feedback/presentation";

function createFeedback(status: FeedbackResult["status"]): FeedbackResult {
  return {
    disclaimer: "虚构免责声明",
    policyDecision: status === "generated" ? "allow_generation" : status,
    reasonCodes: ["NORMAL_JOURNAL_CONTENT"],
    reflection: "虚构反馈",
    schemaVersion: "1",
    status,
    suggestions: [],
  };
}

describe("AI feedback presentation", () => {
  it.each([
    ["PROVIDER_NOT_CONFIGURED", "not-configured"],
    ["PROVIDER_TIMEOUT", "timeout"],
    ["PROVIDER_RATE_LIMITED", "rate-limited"],
    ["PROVIDER_UNAVAILABLE", "unavailable"],
    ["PROVIDER_BLOCKED", "blocked"],
    ["PROVIDER_OUTPUT_INVALID", "invalid"],
    ["PROVIDER_OUTPUT_UNSAFE", "invalid"],
    ["PROVIDER_ERROR", "generic"],
  ] as const)("maps %s to %s", (reasonCode, expected) => {
    expect(getFeedbackFallbackKind([reasonCode])).toBe(expected);
  });

  it("identifies only fixed safety redirects as alerts", () => {
    expect(isSafetyRedirect(createFeedback("crisis_redirect"))).toBe(true);
    expect(isSafetyRedirect(createFeedback("supportive_redirect"))).toBe(true);
    expect(isSafetyRedirect(createFeedback("generated"))).toBe(false);
    expect(isSafetyRedirect(createFeedback("safe_fallback"))).toBe(false);
  });
});
