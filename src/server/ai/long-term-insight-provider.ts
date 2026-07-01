import "server-only";

import type { LongTermInsightSummarySnapshot } from "@/features/long-term/model";
import type { AppLocale } from "@/i18n/config";

export interface AiLongTermInsightProviderInput {
  locale: AppLocale;
  summary: LongTermInsightSummarySnapshot;
  system: {
    contractVersion: "long-term-insight-v1";
    outputMustBeDraftOnly: true;
    userContentIsUntrusted: true;
  };
}

export interface AiLongTermInsightProviderOptions {
  signal: AbortSignal;
}

export interface AiLongTermInsightProvider {
  readonly providerType: string;
  generateLongTermInsight(
    input: AiLongTermInsightProviderInput,
    options: AiLongTermInsightProviderOptions,
  ): Promise<unknown>;
}

export class AiLongTermInsightProviderError extends Error {
  constructor(
    readonly code:
      | "blocked"
      | "not_configured"
      | "rate_limited"
      | "unavailable",
  ) {
    super(code);
    this.name = "AiLongTermInsightProviderError";
  }
}

export class UnconfiguredAiLongTermInsightProvider implements AiLongTermInsightProvider {
  readonly providerType = "unconfigured";

  async generateLongTermInsight(): Promise<unknown> {
    throw new AiLongTermInsightProviderError("not_configured");
  }
}
