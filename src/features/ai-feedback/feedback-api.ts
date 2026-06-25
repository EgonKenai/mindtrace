import type { FeedbackResult } from "@/features/ai-feedback/model";
import { defaultLocale } from "@/i18n/config";

interface ApiErrorPayload {
  error?: {
    code?: string;
  };
}

interface AccountResponse {
  data: {
    hasAiProcessingConsent: boolean;
  };
}

interface AiConsentResponse {
  data: {
    aiProcessingAccepted: boolean;
  };
}

interface FeedbackResponse {
  data: {
    feedback: FeedbackResult;
  };
}

export class AiFeedbackApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, payload: ApiErrorPayload) {
    const code = payload.error?.code ?? "REQUEST_FAILED";
    super(code);
    this.name = "AiFeedbackApiError";
    this.code = code;
    this.status = status;
  }
}

async function parseApiError(response: Response): Promise<AiFeedbackApiError> {
  try {
    return new AiFeedbackApiError(
      response.status,
      (await response.json()) as ApiErrorPayload,
    );
  } catch {
    return new AiFeedbackApiError(response.status, {});
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
    throw await parseApiError(response);
  }

  return (await response.json()) as T;
}

export async function getAiConsentStatus(
  signal?: AbortSignal,
): Promise<boolean> {
  const response = await requestJson<AccountResponse>("/api/v1/account", {
    signal,
  });

  return response.data.hasAiProcessingConsent;
}

export async function updateAiConsent(accepted: boolean): Promise<boolean> {
  const response = await requestJson<AiConsentResponse>(
    "/api/v1/account/ai-consent",
    {
      method: "POST",
      body: JSON.stringify({ accepted, locale: defaultLocale }),
    },
  );

  return response.data.aiProcessingAccepted;
}

export async function generateEntryFeedbackRequest(
  entryId: string,
): Promise<FeedbackResult> {
  const response = await requestJson<FeedbackResponse>(
    `/api/v1/entries/${encodeURIComponent(entryId)}/feedback`,
    { method: "POST" },
  );

  return response.data.feedback;
}
