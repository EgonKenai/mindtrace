import type {
  LongTermSummary,
  LongTermSummaryApiErrorPayload,
  LongTermSummaryWindow,
} from "@/features/long-term/model";

interface LongTermSummaryResponse {
  data: {
    summary: LongTermSummary;
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

export async function getLongTermSummaryRequest(
  window: LongTermSummaryWindow,
  signal?: AbortSignal,
): Promise<LongTermSummary> {
  const response = await fetch(`/api/v1/long-term/summary?window=${window}`, {
    signal,
  });

  if (!response.ok) {
    let payload: LongTermSummaryApiErrorPayload = {};

    try {
      payload = (await response.json()) as LongTermSummaryApiErrorPayload;
    } catch {
      // Keep the public error to a stable code.
    }

    throw new LongTermSummaryApiError(response.status, payload);
  }

  const payload = (await response.json()) as LongTermSummaryResponse;
  return payload.data.summary;
}
