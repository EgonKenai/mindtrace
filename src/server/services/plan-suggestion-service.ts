import type { ActionPlan, PlanSuggestionDraft } from "@/features/plans/model";
import type { PlanSuggestionReasonCode } from "@/features/plans/model";
import { planSuggestionRequestSchema } from "@/lib/validation/plan-suggestions";
import { validatePlanSuggestionProviderOutput } from "@/server/ai/plan-suggestion-output-validation";
import {
  AiPlanSuggestionProviderError,
  UnconfiguredAiPlanSuggestionProvider,
  type AiPlanSuggestionProvider,
  type AiPlanSuggestionProviderInput,
} from "@/server/ai/plan-suggestion-provider";
import { routeFeedbackSafety } from "@/server/ai/policy";
import {
  InvalidRequestError,
  ResourceNotFoundError,
} from "@/server/http/responses";
import {
  createPlanSuggestionRecord,
  getPlanSuggestionRecord,
  listPlanSuggestionRecords,
  updatePlanSuggestionStatusRecord,
  type PlanSuggestionRecord,
} from "@/server/repositories/plan-suggestion-repository";
import { createSuggestedPlanFromDraft } from "@/server/services/plan-service";
import { getServerEnv } from "@/server/env";
import {
  requireAiProcessingConsent,
  requireProductDataAccess,
} from "@/server/services/product-access-service";
import { getLongTermSummary } from "@/server/services/long-term-summary-service";

function getDefaultProviderTimeoutMs(): number {
  return getServerEnv().GEMINI_PROVIDER_TIMEOUT_MS;
}

class ProviderTimeoutError extends Error {
  constructor() {
    super("AI_PLAN_SUGGESTION_PROVIDER_TIMEOUT");
    this.name = "ProviderTimeoutError";
  }
}

export interface PlanSuggestionGenerationResult {
  reasonCodes: PlanSuggestionReasonCode[];
  status: "generated" | "insufficient_data" | "safe_fallback";
  suggestion: PlanSuggestionDraft | null;
}

export interface PlanSuggestionServiceDependencies {
  provider?: AiPlanSuggestionProvider;
  providerFactory?: () => Promise<AiPlanSuggestionProvider | null>;
  timeoutMs?: number;
}

async function createDefaultProvider(): Promise<AiPlanSuggestionProvider | null> {
  const { createConfiguredAiPlanSuggestionProvider } =
    await import("@/server/ai/gemini-provider");
  return createConfiguredAiPlanSuggestionProvider();
}

function serializeSuggestion(
  suggestion: PlanSuggestionRecord,
): PlanSuggestionDraft {
  return {
    description: suggestion.description,
    endDate: suggestion.endDate,
    generatedAt: suggestion.generatedAt.toDate().toISOString(),
    id: suggestion.id,
    linkedTags: [...suggestion.linkedTags],
    rationale: suggestion.rationale,
    safetyLabel: suggestion.safetyLabel,
    schemaVersion: suggestion.schemaVersion,
    startDate: suggestion.startDate,
    status: suggestion.status,
    suggestedActions: suggestion.suggestedActions.map((action) => ({
      description: action.description,
      linkedTags: [...action.linkedTags],
      suggestedDueInDays: action.suggestedDueInDays,
      title: action.title,
    })),
    summaryWindow: suggestion.summaryWindow,
    title: suggestion.title,
  };
}

function buildProviderInput(
  summary: Awaited<ReturnType<typeof getLongTermSummary>>,
): AiPlanSuggestionProviderInput {
  return {
    locale: "zh-CN",
    summary: {
      energyAverage: summary.energyAverage,
      entryCount: summary.entryCount,
      missingDays: [...summary.missingDays],
      moodAverage: summary.moodAverage,
      mostCommonTags: summary.mostCommonTags.map((tag) => ({ ...tag })),
      notablePatterns: [...summary.notablePatterns],
      sleepAverage: summary.sleepAverage,
      sleepQualityAverage: summary.sleepQualityAverage,
      stressAverage: summary.stressAverage,
      summaryWindow: summary.summaryWindow,
    },
    system: {
      contractVersion: "plan-suggestion-v1",
      noAutoCreatePlan: true,
      outputMustBeDraftOnly: true,
      userContentIsUntrusted: true,
    },
  };
}

function providerErrorReason(error: unknown): PlanSuggestionReasonCode {
  if (error instanceof ProviderTimeoutError) {
    return "PROVIDER_TIMEOUT";
  }

  if (error instanceof AiPlanSuggestionProviderError) {
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
): PlanSuggestionReasonCode {
  return reason === "invalid"
    ? "PROVIDER_OUTPUT_INVALID"
    : "PROVIDER_OUTPUT_UNSAFE";
}

async function callProviderWithTimeout(
  provider: AiPlanSuggestionProvider,
  input: AiPlanSuggestionProviderInput,
  timeoutMs: number,
): Promise<unknown> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      provider.generatePlanSuggestion(input, { signal: controller.signal }),
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

function addDaysToLocalDate(localDate: string, days: number): string {
  const [year, month, day] = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return date.toISOString().slice(0, 10);
}

export async function generatePlanSuggestion(
  userId: string | null | undefined,
  input: unknown,
  dependencies: PlanSuggestionServiceDependencies = {},
): Promise<PlanSuggestionGenerationResult> {
  const context = await requireProductDataAccess(userId);
  const parsed = planSuggestionRequestSchema.parse(input);
  const summary = await getLongTermSummary(context.userId, {
    window: parsed.summaryWindow,
  });

  if (summary.status === "insufficient_data") {
    return {
      reasonCodes: ["INSUFFICIENT_DATA"],
      status: "insufficient_data",
      suggestion: null,
    };
  }

  const policy = routeFeedbackSafety(summary.notablePatterns.join("\n"));

  if (policy.decision !== "allow_generation") {
    return {
      reasonCodes: ["CRISIS_OR_HIGH_RISK_SIGNAL"],
      status: "safe_fallback",
      suggestion: null,
    };
  }

  await requireAiProcessingConsent(context.userId);

  const configuredProvider =
    dependencies.provider ??
    (await (dependencies.providerFactory ?? createDefaultProvider)());
  const provider =
    configuredProvider ?? new UnconfiguredAiPlanSuggestionProvider();
  let rawOutput: unknown;

  try {
    rawOutput = await callProviderWithTimeout(
      provider,
      buildProviderInput(summary),
      dependencies.timeoutMs ?? getDefaultProviderTimeoutMs(),
    );
  } catch (error) {
    return {
      reasonCodes: [providerErrorReason(error)],
      status: "safe_fallback",
      suggestion: null,
    };
  }

  const validation = validatePlanSuggestionProviderOutput(rawOutput);

  if (!validation.success) {
    return {
      reasonCodes: [validationReason(validation.reason)],
      status: "safe_fallback",
      suggestion: null,
    };
  }

  const suggestion = await createPlanSuggestionRecord(context.userId, {
    ...validation.output,
    endDate: summary.endDate,
    safetyLabel: "low_risk",
    startDate: summary.startDate,
    summaryWindow: summary.summaryWindow,
  });

  return {
    reasonCodes: ["NORMAL_SUMMARY_CONTENT"],
    status: "generated",
    suggestion: serializeSuggestion(suggestion),
  };
}

export async function listPlanSuggestions(
  userId: string | null | undefined,
): Promise<PlanSuggestionDraft[]> {
  const context = await requireProductDataAccess(userId);
  const suggestions = await listPlanSuggestionRecords(context.userId);

  return suggestions.map((suggestion) => serializeSuggestion(suggestion));
}

export async function dismissPlanSuggestion(
  userId: string | null | undefined,
  suggestionId: string,
): Promise<PlanSuggestionDraft> {
  const context = await requireProductDataAccess(userId);
  const suggestion = await getPlanSuggestionRecord(
    context.userId,
    suggestionId,
  );

  if (!suggestion) {
    throw new ResourceNotFoundError();
  }

  if (suggestion.status !== "draft") {
    throw new InvalidRequestError();
  }

  const updated = await updatePlanSuggestionStatusRecord(
    context.userId,
    suggestionId,
    "dismissed",
  );

  if (!updated) {
    throw new ResourceNotFoundError();
  }

  return serializeSuggestion(updated);
}

export async function acceptPlanSuggestion(
  userId: string | null | undefined,
  suggestionId: string,
): Promise<{ plan: ActionPlan; suggestion: PlanSuggestionDraft }> {
  const context = await requireProductDataAccess(userId);
  const suggestion = await getPlanSuggestionRecord(
    context.userId,
    suggestionId,
  );

  if (!suggestion) {
    throw new ResourceNotFoundError();
  }

  if (suggestion.status !== "draft") {
    throw new InvalidRequestError();
  }

  const targetDate =
    suggestion.suggestedActions.length > 0
      ? addDaysToLocalDate(
          suggestion.startDate,
          Math.max(
            ...suggestion.suggestedActions.map(
              (action) => action.suggestedDueInDays,
            ),
          ),
        )
      : null;
  const plan = await createSuggestedPlanFromDraft(context.userId, {
    actions: suggestion.suggestedActions.map((action) => ({
      description: action.description,
      dueDate: addDaysToLocalDate(
        suggestion.startDate,
        action.suggestedDueInDays,
      ),
      title: action.title,
    })),
    description: suggestion.description,
    linkedTags: suggestion.linkedTags,
    startDate: suggestion.startDate,
    targetDate,
    title: suggestion.title,
  });
  const updated = await updatePlanSuggestionStatusRecord(
    context.userId,
    suggestionId,
    "accepted",
  );

  if (!updated) {
    throw new ResourceNotFoundError();
  }

  return {
    plan,
    suggestion: serializeSuggestion(updated),
  };
}
