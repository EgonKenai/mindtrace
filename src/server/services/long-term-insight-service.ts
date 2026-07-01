import type {
  LongTermInsightDraft,
  LongTermInsightReasonCode,
  LongTermInsightSummarySnapshot,
} from "@/features/long-term/model";
import type { AppLocale } from "@/i18n/config";
import { longTermInsightRequestSchema } from "@/lib/validation/long-term-insights";
import { validateLongTermInsightProviderOutput } from "@/server/ai/long-term-insight-output-validation";
import {
  AiLongTermInsightProviderError,
  UnconfiguredAiLongTermInsightProvider,
  type AiLongTermInsightProvider,
  type AiLongTermInsightProviderInput,
} from "@/server/ai/long-term-insight-provider";
import { routeFeedbackSafety } from "@/server/ai/policy";
import {
  InvalidRequestError,
  ResourceNotFoundError,
} from "@/server/http/responses";
import {
  createLongTermInsightRecord,
  getLongTermInsightRecord,
  listLongTermInsightRecords,
  updateLongTermInsightStatusRecord,
  type LongTermInsightRecord,
} from "@/server/repositories/long-term-insight-repository";
import { getLongTermSummary } from "@/server/services/long-term-summary-service";
import {
  requireAiProcessingConsent,
  requireProductDataAccess,
} from "@/server/services/product-access-service";
import { getServerEnv } from "@/server/env";

function getDefaultProviderTimeoutMs(): number {
  return getServerEnv().GEMINI_PROVIDER_TIMEOUT_MS;
}

class ProviderTimeoutError extends Error {
  constructor() {
    super("AI_LONG_TERM_INSIGHT_PROVIDER_TIMEOUT");
    this.name = "ProviderTimeoutError";
  }
}

export interface LongTermInsightGenerationResult {
  insight: LongTermInsightDraft | null;
  reasonCodes: LongTermInsightReasonCode[];
  status: "generated" | "insufficient_data" | "safe_fallback";
}

export interface LongTermInsightServiceDependencies {
  provider?: AiLongTermInsightProvider;
  providerFactory?: () => Promise<AiLongTermInsightProvider | null>;
  timeoutMs?: number;
}

async function createDefaultProvider(): Promise<AiLongTermInsightProvider | null> {
  const { createConfiguredAiLongTermInsightProvider } =
    await import("@/server/ai/gemini-provider");
  return createConfiguredAiLongTermInsightProvider();
}

function serializeInsight(
  insight: LongTermInsightRecord,
): LongTermInsightDraft {
  return {
    endDate: insight.endDate,
    generatedAt: insight.generatedAt.toDate().toISOString(),
    gentleSuggestions: insight.gentleSuggestions.map((suggestion) => ({
      ...suggestion,
    })),
    id: insight.id,
    overview: insight.overview,
    patterns: insight.patterns.map((pattern) => ({
      ...pattern,
      relatedTags: [...pattern.relatedTags],
    })),
    planSuggestionRefs: [...insight.planSuggestionRefs],
    safetyLabel: insight.safetyLabel,
    schemaVersion: insight.schemaVersion,
    sourceSummarySnapshot: {
      ...insight.sourceSummarySnapshot,
      missingDays: [...insight.sourceSummarySnapshot.missingDays],
      mostCommonTags: insight.sourceSummarySnapshot.mostCommonTags.map(
        (tag) => ({ ...tag }),
      ),
      notablePatterns: [...insight.sourceSummarySnapshot.notablePatterns],
    },
    startDate: insight.startDate,
    status: insight.status,
    strengths: [...insight.strengths],
    summaryWindow: insight.summaryWindow,
    title: insight.title,
    updatedAt: insight.updatedAt.toDate().toISOString(),
    watchPoints: [...insight.watchPoints],
  };
}

function buildSummarySnapshot(
  summary: Awaited<ReturnType<typeof getLongTermSummary>>,
): LongTermInsightSummarySnapshot {
  return {
    endDate: summary.endDate,
    energyAverage: summary.energyAverage,
    entryCount: summary.entryCount,
    missingDays: [...summary.missingDays],
    moodAverage: summary.moodAverage,
    mostCommonTags: summary.mostCommonTags.map((tag) => ({ ...tag })),
    notablePatterns: [...summary.notablePatterns],
    sleepAverage: summary.sleepAverage,
    sleepQualityAverage: summary.sleepQualityAverage,
    startDate: summary.startDate,
    stressAverage: summary.stressAverage,
    summaryWindow: summary.summaryWindow,
  };
}

function buildProviderInput(
  summary: Awaited<ReturnType<typeof getLongTermSummary>>,
  locale: AppLocale,
): AiLongTermInsightProviderInput {
  return {
    locale,
    summary: buildSummarySnapshot(summary),
    system: {
      contractVersion: "long-term-insight-v1",
      outputMustBeDraftOnly: true,
      userContentIsUntrusted: true,
    },
  };
}

function providerErrorReason(error: unknown): LongTermInsightReasonCode {
  if (error instanceof ProviderTimeoutError) {
    return "PROVIDER_TIMEOUT";
  }

  if (error instanceof AiLongTermInsightProviderError) {
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

function validationReason(
  reason: "invalid" | "unsafe",
): LongTermInsightReasonCode {
  return reason === "invalid"
    ? "PROVIDER_OUTPUT_INVALID"
    : "PROVIDER_OUTPUT_UNSAFE";
}

async function callProviderWithTimeout(
  provider: AiLongTermInsightProvider,
  input: AiLongTermInsightProviderInput,
  timeoutMs: number,
): Promise<unknown> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      provider.generateLongTermInsight(input, { signal: controller.signal }),
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

export async function generateLongTermInsight(
  userId: string | null | undefined,
  input: unknown,
  dependencies: LongTermInsightServiceDependencies = {},
): Promise<LongTermInsightGenerationResult> {
  const context = await requireProductDataAccess(userId);
  const parsed = longTermInsightRequestSchema.parse(input);
  const summary = await getLongTermSummary(context.userId, {
    window: parsed.summaryWindow,
  });

  if (summary.status === "insufficient_data") {
    return {
      insight: null,
      reasonCodes: ["INSUFFICIENT_DATA"],
      status: "insufficient_data",
    };
  }

  const policy = routeFeedbackSafety(summary.notablePatterns.join("\n"));

  if (policy.decision !== "allow_generation") {
    return {
      insight: null,
      reasonCodes: ["CRISIS_OR_HIGH_RISK_SIGNAL"],
      status: "safe_fallback",
    };
  }

  await requireAiProcessingConsent(context.userId);

  const configuredProvider =
    dependencies.provider ??
    (await (dependencies.providerFactory ?? createDefaultProvider)());
  const provider =
    configuredProvider ?? new UnconfiguredAiLongTermInsightProvider();
  let rawOutput: unknown;

  try {
    rawOutput = await callProviderWithTimeout(
      provider,
      buildProviderInput(summary, parsed.locale),
      dependencies.timeoutMs ?? getDefaultProviderTimeoutMs(),
    );
  } catch (error) {
    return {
      insight: null,
      reasonCodes: [providerErrorReason(error)],
      status: "safe_fallback",
    };
  }

  const validation = validateLongTermInsightProviderOutput(rawOutput);

  if (!validation.success) {
    return {
      insight: null,
      reasonCodes: [validationReason(validation.reason)],
      status: "safe_fallback",
    };
  }

  const insight = await createLongTermInsightRecord(context.userId, {
    ...validation.output,
    endDate: summary.endDate,
    safetyLabel: "low_risk",
    sourceSummarySnapshot: buildSummarySnapshot(summary),
    startDate: summary.startDate,
    summaryWindow: summary.summaryWindow,
  });

  return {
    insight: serializeInsight(insight),
    reasonCodes: ["NORMAL_SUMMARY_CONTENT"],
    status: "generated",
  };
}

export async function listLongTermInsights(
  userId: string | null | undefined,
): Promise<LongTermInsightDraft[]> {
  const context = await requireProductDataAccess(userId);
  const insights = await listLongTermInsightRecords(context.userId);

  return insights.map((insight) => serializeInsight(insight));
}

export async function getLongTermInsight(
  userId: string | null | undefined,
  insightId: string,
): Promise<LongTermInsightDraft> {
  const context = await requireProductDataAccess(userId);
  const insight = await getLongTermInsightRecord(context.userId, insightId);

  if (!insight) {
    throw new ResourceNotFoundError();
  }

  return serializeInsight(insight);
}

export async function saveLongTermInsight(
  userId: string | null | undefined,
  insightId: string,
): Promise<LongTermInsightDraft> {
  const context = await requireProductDataAccess(userId);
  const insight = await getLongTermInsightRecord(context.userId, insightId);

  if (!insight) {
    throw new ResourceNotFoundError();
  }

  if (insight.status !== "draft") {
    throw new InvalidRequestError();
  }

  const updated = await updateLongTermInsightStatusRecord(
    context.userId,
    insightId,
    "saved",
  );

  if (!updated) {
    throw new ResourceNotFoundError();
  }

  return serializeInsight(updated);
}

export async function dismissLongTermInsight(
  userId: string | null | undefined,
  insightId: string,
): Promise<LongTermInsightDraft> {
  const context = await requireProductDataAccess(userId);
  const insight = await getLongTermInsightRecord(context.userId, insightId);

  if (!insight) {
    throw new ResourceNotFoundError();
  }

  if (insight.status !== "draft") {
    throw new InvalidRequestError();
  }

  const updated = await updateLongTermInsightStatusRecord(
    context.userId,
    insightId,
    "dismissed",
  );

  if (!updated) {
    throw new ResourceNotFoundError();
  }

  return serializeInsight(updated);
}
