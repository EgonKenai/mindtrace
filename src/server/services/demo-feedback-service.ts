import "server-only";

import {
  FEEDBACK_SCHEMA_VERSION,
  type FeedbackResult,
} from "@/features/ai-feedback/model";
import {
  feedbackResultSchema,
  type FeedbackReasonCode,
} from "@/lib/validation/ai-feedback";
import type { AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { buildAiFeedbackProviderInputFromFields } from "@/server/ai/input";
import { validateProviderOutput } from "@/server/ai/output-validation";
import {
  AiFeedbackProviderError,
  UnconfiguredAiFeedbackProvider,
  type AiFeedbackProvider,
} from "@/server/ai/provider";
import { routeFeedbackSafety } from "@/server/ai/policy";
import {
  createCrisisRedirectFeedback,
  createSafeFallbackFeedback,
  createSupportiveRedirectFeedback,
} from "@/server/ai/templates";
import { getServerEnv } from "@/server/env";

export interface DemoReflectionServiceDependencies {
  provider?: AiFeedbackProvider;
  providerFactory?: () => Promise<AiFeedbackProvider | null>;
  timeoutMs?: number;
}

class DemoProviderTimeoutError extends Error {
  constructor() {
    super("DEMO_AI_PROVIDER_TIMEOUT");
    this.name = "DemoProviderTimeoutError";
  }
}

async function createDefaultProvider(): Promise<AiFeedbackProvider | null> {
  const { createConfiguredAiFeedbackProvider } =
    await import("@/server/ai/gemini-provider");
  return createConfiguredAiFeedbackProvider();
}

function providerErrorReason(error: unknown): FeedbackReasonCode {
  if (error instanceof DemoProviderTimeoutError) {
    return "PROVIDER_TIMEOUT";
  }

  if (error instanceof AiFeedbackProviderError) {
    switch (error.code) {
      case "not_configured":
        return "PROVIDER_NOT_CONFIGURED";
      case "blocked":
        return "PROVIDER_BLOCKED";
      case "rate_limited":
        return "PROVIDER_RATE_LIMITED";
      case "unavailable":
        return "PROVIDER_UNAVAILABLE";
    }
  }

  return "PROVIDER_ERROR";
}

async function callProviderWithTimeout(
  provider: AiFeedbackProvider,
  input: Parameters<AiFeedbackProvider["generateFeedback"]>[0],
  timeoutMs: number,
): Promise<unknown> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      provider.generateFeedback(input, { signal: controller.signal }),
      new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new DemoProviderTimeoutError());
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function generateDemoReflection(
  note: string,
  locale: AppLocale,
  dependencies: DemoReflectionServiceDependencies = {},
): Promise<FeedbackResult> {
  const policy = routeFeedbackSafety(note);

  if (policy.decision === "crisis_redirect") {
    return createCrisisRedirectFeedback(policy.reasonCodes, locale);
  }

  if (policy.decision === "supportive_redirect") {
    return createSupportiveRedirectFeedback(policy.reasonCodes, locale);
  }

  if (policy.decision === "safe_fallback") {
    return createSafeFallbackFeedback(policy.reasonCodes, locale);
  }

  const configuredProvider =
    dependencies.provider ??
    (await (dependencies.providerFactory ?? createDefaultProvider)());
  const provider = configuredProvider ?? new UnconfiguredAiFeedbackProvider();
  const providerInput = buildAiFeedbackProviderInputFromFields(
    {
      mood: 5,
      stress: 5,
      energy: 5,
      sleepHours: 7,
      sleepQuality: 5,
      eventTags: ["other"],
      note,
    },
    locale,
  );
  let rawOutput: unknown;

  try {
    rawOutput = await callProviderWithTimeout(
      provider,
      providerInput,
      dependencies.timeoutMs ?? getServerEnv().GEMINI_PROVIDER_TIMEOUT_MS,
    );
  } catch (error) {
    return createSafeFallbackFeedback([providerErrorReason(error)], locale);
  }

  const validation = validateProviderOutput(rawOutput, note);

  if (!validation.success) {
    return createSafeFallbackFeedback(
      [
        validation.reason === "invalid"
          ? "PROVIDER_OUTPUT_INVALID"
          : "PROVIDER_OUTPUT_UNSAFE",
      ],
      locale,
    );
  }

  const messages = getMessages(locale);

  return feedbackResultSchema.parse({
    schemaVersion: FEEDBACK_SCHEMA_VERSION,
    status: "generated",
    reflection: validation.output.reflection,
    suggestions: validation.output.suggestions,
    disclaimer: messages.aiFeedback.disclaimer,
    policyDecision: "allow_generation",
    reasonCodes: policy.reasonCodes,
  });
}
