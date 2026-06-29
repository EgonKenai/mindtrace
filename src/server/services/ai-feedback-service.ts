import {
  FEEDBACK_SCHEMA_VERSION,
  type FeedbackResult,
} from "@/features/ai-feedback/model";
import {
  feedbackResultSchema,
  type FeedbackReasonCode,
} from "@/lib/validation/ai-feedback";
import { zhCN } from "@/i18n/messages/zh-CN";
import { buildAiFeedbackProviderInput } from "@/server/ai/input";
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
import { ResourceNotFoundError } from "@/server/http/responses";
import { getJournalEntryRecord } from "@/server/repositories/journal-repository";
import {
  requireAiProcessingConsent,
  requireProductDataAccess,
} from "@/server/services/product-access-service";

const DEFAULT_PROVIDER_TIMEOUT_MS = 3_000;

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
): Promise<unknown> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      provider.generateFeedback(input, { signal: controller.signal }),
      new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new ProviderTimeoutError());
        }, timeoutMs);
      }),
    ]);
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
): Promise<FeedbackResult> {
  const context = await requireProductDataAccess(userId);
  const entry = await getJournalEntryRecord(context.userId, entryId);

  if (!entry) {
    throw new ResourceNotFoundError();
  }

  const auditLogger = dependencies.auditLogger ?? noOpAuditLogger;
  const policy = routeFeedbackSafety(entry.note);

  if (policy.decision === "crisis_redirect") {
    return recordAndSerialize(
      createCrisisRedirectFeedback(policy.reasonCodes),
      auditLogger,
    );
  }

  if (policy.decision === "supportive_redirect") {
    return recordAndSerialize(
      createSupportiveRedirectFeedback(policy.reasonCodes),
      auditLogger,
    );
  }

  if (policy.decision === "safe_fallback") {
    return recordAndSerialize(
      createSafeFallbackFeedback(policy.reasonCodes),
      auditLogger,
    );
  }

  const configuredProvider =
    dependencies.provider ??
    (await (dependencies.providerFactory ?? createDefaultProvider)());
  const provider = configuredProvider ?? new UnconfiguredAiFeedbackProvider();

  if (provider.providerType !== "unconfigured") {
    await requireAiProcessingConsent(context.userId);
  }

  const providerInput = buildAiFeedbackProviderInput(entry);
  let rawOutput: unknown;

  try {
    rawOutput = await callProviderWithTimeout(
      provider,
      providerInput,
      dependencies.timeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS,
    );
  } catch (error) {
    return recordAndSerialize(
      createSafeFallbackFeedback([providerErrorReason(error)]),
      auditLogger,
    );
  }

  const validation = validateProviderOutput(rawOutput, entry.note);

  if (!validation.success) {
    return recordAndSerialize(
      createSafeFallbackFeedback([
        validation.reason === "invalid"
          ? "PROVIDER_OUTPUT_INVALID"
          : "PROVIDER_OUTPUT_UNSAFE",
      ]),
      auditLogger,
    );
  }

  return recordAndSerialize(
    feedbackResultSchema.parse({
      schemaVersion: FEEDBACK_SCHEMA_VERSION,
      status: "generated",
      reflection: validation.output.reflection,
      suggestions: validation.output.suggestions,
      disclaimer: zhCN.aiFeedback.disclaimer,
      policyDecision: "allow_generation",
      reasonCodes: policy.reasonCodes,
    }),
    auditLogger,
  );
}
