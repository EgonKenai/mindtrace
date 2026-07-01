import type {
  LongTermInsightDraft,
  LongTermInsightGenerationResult,
  LongTermSummary,
  LongTermSummaryApiErrorPayload,
  LongTermSummaryWindow,
} from "@/features/long-term/model";
import type { AppLocale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";

interface LongTermSummaryResponse {
  data: {
    summary: LongTermSummary;
  };
}

interface LongTermInsightGenerationResponse {
  data: LongTermInsightGenerationResult;
}

interface LongTermInsightListResponse {
  data: {
    insights: LongTermInsightDraft[];
  };
}

interface LongTermInsightResponse {
  data: {
    insight: LongTermInsightDraft;
  };
}

export class LongTermSummaryApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, payload: LongTermSummaryApiErrorPayload) {
    const code = payload.error?.code ?? "REQUEST_FAILED";
    super(code);
    this.name = "LongTermSummaryApiError";
    this.code = code;
    this.status = status;
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let payload: LongTermSummaryApiErrorPayload = {};

    try {
      payload = (await response.json()) as LongTermSummaryApiErrorPayload;
    } catch {
      // Stable code and HTTP status are enough for presentation.
    }

    throw new LongTermSummaryApiError(response.status, payload);
  }

  return (await response.json()) as T;
}

export async function getLongTermSummaryRequest(
  window: LongTermSummaryWindow,
  signal?: AbortSignal,
): Promise<LongTermSummary> {
  const payload = await requestJson<LongTermSummaryResponse>(
    `/api/v1/long-term/summary?window=${window}`,
    { signal },
  );
  return payload.data.summary;
}

export async function listLongTermInsightsRequest(
  signal?: AbortSignal,
): Promise<LongTermInsightDraft[]> {
  const response = await requestJson<LongTermInsightListResponse>(
    "/api/v1/long-term/insights",
    { signal },
  );

  return response.data.insights;
}

export async function generateLongTermInsightRequest(
  summaryWindow: LongTermSummaryWindow,
  locale: AppLocale = defaultLocale,
): Promise<LongTermInsightGenerationResult> {
  const response = await requestJson<LongTermInsightGenerationResponse>(
    "/api/v1/long-term/insights",
    {
      method: "POST",
      body: JSON.stringify({ locale, summaryWindow }),
    },
  );

  return response.data;
}

export async function saveLongTermInsightRequest(
  insightId: string,
): Promise<LongTermInsightDraft> {
  const response = await requestJson<LongTermInsightResponse>(
    `/api/v1/long-term/insights/${encodeURIComponent(insightId)}/save`,
    { method: "POST" },
  );

  return response.data.insight;
}

export async function dismissLongTermInsightRequest(
  insightId: string,
): Promise<LongTermInsightDraft> {
  const response = await requestJson<LongTermInsightResponse>(
    `/api/v1/long-term/insights/${encodeURIComponent(insightId)}/dismiss`,
    { method: "POST" },
  );

  return response.data.insight;
}
