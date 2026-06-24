import type {
  RecentTrends,
  TrendsApiErrorPayload,
} from "@/features/trends/model";

interface TrendsResponse {
  data: RecentTrends;
}

export class TrendsApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, payload: TrendsApiErrorPayload) {
    const code = payload.error?.code ?? "REQUEST_FAILED";
    super(code);
    this.name = "TrendsApiError";
    this.code = code;
    this.status = status;
  }
}

export async function getRecentTrendsRequest(
  signal?: AbortSignal,
): Promise<RecentTrends> {
  const response = await fetch("/api/v1/trends?days=7", { signal });

  if (!response.ok) {
    let payload: TrendsApiErrorPayload = {};

    try {
      payload = (await response.json()) as TrendsApiErrorPayload;
    } catch {
      // The status remains sufficient for the safe fallback error.
    }

    throw new TrendsApiError(response.status, payload);
  }

  const payload = (await response.json()) as TrendsResponse;
  return payload.data;
}
