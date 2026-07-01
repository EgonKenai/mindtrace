import type { AppLocale } from "@/i18n/config";

export interface AiFeedbackProviderInput {
  journal: {
    energy: number;
    eventTags: string[];
    mood: number;
    note: string;
    sleepHours: number;
    sleepQuality: number;
    stress: number;
  };
  locale: AppLocale;
  system: {
    contractVersion: "1";
    userContentIsUntrusted: true;
  };
  trendSummary?: {
    recordedDays: number;
    totalEntries: number;
  };
}

export interface AiFeedbackProviderOptions {
  signal: AbortSignal;
}

export interface AiFeedbackProvider {
  readonly providerType: string;
  generateFeedback(
    input: AiFeedbackProviderInput,
    options: AiFeedbackProviderOptions,
  ): Promise<unknown>;
}

export type AiFeedbackProviderErrorCode =
  | "blocked"
  | "not_configured"
  | "rate_limited"
  | "unavailable";

export class AiFeedbackProviderError extends Error {
  constructor(readonly code: AiFeedbackProviderErrorCode) {
    super("AI_FEEDBACK_PROVIDER_ERROR");
    this.name = "AiFeedbackProviderError";
  }
}

export class UnconfiguredAiFeedbackProvider implements AiFeedbackProvider {
  readonly providerType = "unconfigured";

  async generateFeedback(): Promise<never> {
    throw new AiFeedbackProviderError("not_configured");
  }
}
