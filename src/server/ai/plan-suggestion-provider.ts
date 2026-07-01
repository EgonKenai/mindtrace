import "server-only";

import type { JournalEventTagId } from "@/features/journal/model";
import type { LongTermSummaryWindow } from "@/features/long-term/model";
import type { AppLocale } from "@/i18n/config";

export interface AiPlanSuggestionProviderSummaryInput {
  energyAverage: number | null;
  entryCount: number;
  missingDays: string[];
  moodAverage: number | null;
  mostCommonTags: Array<{ count: number; tag: JournalEventTagId }>;
  notablePatterns: string[];
  sleepAverage: number | null;
  sleepQualityAverage: number | null;
  stressAverage: number | null;
  summaryWindow: LongTermSummaryWindow;
}

export interface AiPlanSuggestionProviderInput {
  locale: AppLocale;
  summary: AiPlanSuggestionProviderSummaryInput;
  system: {
    contractVersion: "plan-suggestion-v1";
    noAutoCreatePlan: true;
    outputMustBeDraftOnly: true;
    userContentIsUntrusted: true;
  };
}

export interface AiPlanSuggestionProviderOptions {
  signal: AbortSignal;
}

export interface AiPlanSuggestionProvider {
  readonly providerType: string;
  generatePlanSuggestion(
    input: AiPlanSuggestionProviderInput,
    options: AiPlanSuggestionProviderOptions,
  ): Promise<unknown>;
}

export class AiPlanSuggestionProviderError extends Error {
  constructor(
    readonly code:
      | "blocked"
      | "not_configured"
      | "rate_limited"
      | "unavailable",
  ) {
    super(code);
    this.name = "AiPlanSuggestionProviderError";
  }
}

export class UnconfiguredAiPlanSuggestionProvider implements AiPlanSuggestionProvider {
  readonly providerType = "unconfigured";

  async generatePlanSuggestion(): Promise<unknown> {
    throw new AiPlanSuggestionProviderError("not_configured");
  }
}
