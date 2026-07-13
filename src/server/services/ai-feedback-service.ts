import {
  FEEDBACK_SCHEMA_VERSION,
  type FeedbackResult,
} from "@/features/ai-feedback/model";
import {
  feedbackResultSchema,
  type FeedbackReasonCode,
} from "@/lib/validation/ai-feedback";
import type { AppLocale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { buildAiFeedbackProviderInput } from "@/server/ai/input";
import { validateProviderOutput } from "@/server/ai/output-validation";
import {
  AiFeedbackProviderError,
  UnconfiguredAiFeedbackProvider,
  type AiFeedbackProvider,
  type AiFeedbackTimingLogger,
} from "@/server/ai/provider";
import { routeFeedbackSafety } from "@/server/ai/policy";
import {
  createCrisisRedirectFeedback,
  createSafeFallbackFeedback,
  createSupportiveRedirectFeedback,
} from "@/server/ai/templates";
import { ResourceNotFoundError } from "@/server/http/responses";
import { getJournalEntryRecord } from "@/server/repositories/journal-repository";
import {
  requireAiProcessingConsent,
  requireProductDataAccess,
} from "@/server/services/product-access-service";
import { getServerEnv } from "@/server/env";

function getDefaultProviderTimeoutMs(): number {
  return getServerEnv().GEMINI_PROVIDER_TIMEOUT_MS;
}

export interface FeedbackAuditEvent {
  decision: FeedbackResult["policyDecision"];
  reasonCodes: FeedbackReasonCode[];
}

export interface FeedbackAuditLogger {
  record(event: FeedbackAuditEvent): void;
}

export interface AiFeedbackServiceDependencies {
  auditLogger?: FeedbackAuditLogger;
  provider?: AiFeedbackProvider;
  providerFactory?: () => Promise<AiFeedbackProvider | null>;
  timingLogger?: AiFeedbackTimingLogger;
  timeoutMs?: number;
}

const noOpAuditLogger: FeedbackAuditLogger = {
  record() {},
};

class ProviderTimeoutError extends Error {
  constructor() {
    super("AI_FEEDBACK_PROVIDER_TIMEOUT");
    this.name = "ProviderTimeoutError";
  }
}

async function createDefaultProvider(): Promise<AiFeedbackProvider | null> {
  const { createConfiguredAiFeedbackProvider } =
    await import("@/server/ai/gemini-provider");
  return createConfiguredAiFeedbackProvider();
}

function serializeFeedbackResult(result: FeedbackResult): FeedbackResult {
  const parsed = feedbackResultSchema.parse(result);

  return {
    schemaVersion: parsed.schemaVersion,
    status: parsed.status,
    reflection: parsed.reflection,
    suggestions: [...parsed.suggestions],
    disclaimer: parsed.disclaimer,
    policyDecision: parsed.policyDecision,
    reasonCodes: [...parsed.reasonCodes],
  };
}

function recordAndSerialize(
  result: FeedbackResult,
  auditLogger: FeedbackAuditLogger,
): FeedbackResult {
  auditLogger.record({
    decision: result.policyDecision,
    reasonCodes: [...result.reasonCodes],
  });
  return serializeFeedbackResult(result);
}

function providerErrorReason(error: unknown): FeedbackReasonCode {
  if (error instanceof ProviderTimeoutError) {
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
  timingLogger?: AiFeedbackTimingLogger,
): Promise<unknown> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const providerStartedAt = performance.now();
  timingLogger?.record({ stage: "provider_wait_started" });

  try {
    const output = await Promise.race([
      provider.generateFeedback(input, {
        signal: controller.signal,
        timingLogger,
      }),
      new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new ProviderTimeoutError());
        }, timeoutMs);
      }),
    ]);
    timingLogger?.record({
      stage: "provider_wait_completed",
      stepMs: performance.now() - providerStartedAt,
    });
    return output;
  } catch (error) {
    timingLogger?.record({
      stage: "provider_wait_failed",
      stepMs: performance.now() - providerStartedAt,
      ...(error instanceof AiFeedbackProviderError
        ? { providerErrorCode: error.code }
        : {}),
    });
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function generateEntryFeedback(
  userId: string | null | undefined,
  entryId: string,
  dependencies: AiFeedbackServiceDependencies = {},
  locale: AppLocale = defaultLocale,
): Promise<FeedbackResult> {
  const timingLogger = dependencies.timingLogger;
  const accessStartedAt = performance.now();
  const context = await requireProductDataAccess(userId);
  timingLogger?.record({
    stage: "product_access_checked",
    stepMs: performance.now() - accessStartedAt,
  });

  const databaseStartedAt = performance.now();
  const entry = await getJournalEntryRecord(context.userId, entryId);
  timingLogger?.record({
    stage: "database_query_completed",
    stepMs: performance.now() - databaseStartedAt,
  });

  if (!entry) {
    throw new ResourceNotFoundError();
  }

  const auditLogger = dependencies.auditLogger ?? noOpAuditLogger;
  const safetyStartedAt = performance.now();
  const policy = routeFeedbackSafety(entry.note);
  timingLogger?.record({
    stage: "local_safety_routed",
    stepMs: performance.now() - safetyStartedAt,
  });

  if (policy.decision === "crisis_redirect") {
    return recordAndSerialize(
      createCrisisRedirectFeedback(policy.reasonCodes, locale),
      auditLogger,
    );
  }

  if (policy.decision === "supportive_redirect") {
    return recordAndSerialize(
      createSupportiveRedirectFeedback(policy.reasonCodes, locale),
      auditLogger,
    );
  }

  if (policy.decision === "safe_fallback") {
    return recordAndSerialize(
      createSafeFallbackFeedback(policy.reasonCodes, locale),
      auditLogger,
    );
  }

  const providerFactoryStartedAt = performance.now();
  const configuredProvider =
    dependencies.provider ??
    (await (dependencies.providerFactory ?? createDefaultProvider)());
  const provider = configuredProvider ?? new UnconfiguredAiFeedbackProvider();
  timingLogger?.record({
    stage: "provider_config_resolved",
    stepMs: performance.now() - providerFactoryStartedAt,
  });

  if (provider.providerType !== "unconfigured") {
    const aiConsentStartedAt = performance.now();
    await requireAiProcessingConsent(context.userId);
    timingLogger?.record({
      stage: "ai_processing_consent_checked",
      stepMs: performance.now() - aiConsentStartedAt,
    });
  }

  const inputStartedAt = performance.now();
  const providerInput = buildAiFeedbackProviderInput(entry, locale);
  timingLogger?.record({
    stage: "provider_input_built",
    stepMs: performance.now() - inputStartedAt,
  });
  let rawOutput: unknown;

  try {
    rawOutput = await callProviderWithTimeout(
      provider,
      providerInput,
      dependencies.timeoutMs ?? getDefaultProviderTimeoutMs(),
      timingLogger,
    );
  } catch (error) {
    return recordAndSerialize(
      createSafeFallbackFeedback([providerErrorReason(error)], locale),
      auditLogger,
    );
  }

  const validationStartedAt = performance.now();
  const validation = validateProviderOutput(rawOutput, entry.note);
  timingLogger?.record({
    stage: "provider_output_validated",
    stepMs: performance.now() - validationStartedAt,
  });

  if (!validation.success) {
    return recordAndSerialize(
      createSafeFallbackFeedback(
        [
          validation.reason === "invalid"
            ? "PROVIDER_OUTPUT_INVALID"
            : "PROVIDER_OUTPUT_UNSAFE",
        ],
        locale,
      ),
      auditLogger,
    );
  }

  const messages = getMessages(locale);

  return recordAndSerialize(
    feedbackResultSchema.parse({
      schemaVersion: FEEDBACK_SCHEMA_VERSION,
      status: "generated",
      reflection: validation.output.reflection,
      suggestions: validation.output.suggestions,
      disclaimer: messages.aiFeedback.disclaimer,
      policyDecision: "allow_generation",
      reasonCodes: policy.reasonCodes,
    }),
    auditLogger,
  );
}
