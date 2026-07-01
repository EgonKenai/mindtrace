import type {
  ActionPlan,
  PlanAction,
  PlanApiErrorPayload,
  PlanFieldName,
  PlanSuggestionDraft,
  PlanSuggestionGenerationResult,
  PlanStatus,
} from "@/features/plans/model";
import type {
  CreatePlanActionInput,
  CreatePlanInput,
  UpdatePlanInput,
} from "@/lib/validation/plans";
import type { AppLocale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";

interface PlanResponse {
  data: {
    plan: ActionPlan;
  };
}

interface PlanListResponse {
  data: {
    plans: ActionPlan[];
  };
}

interface PlanActionResponse {
  data: {
    action: PlanAction;
  };
}

interface PlanSuggestionGenerationResponse {
  data: PlanSuggestionGenerationResult;
}

interface PlanSuggestionResponse {
  data: {
    suggestion: PlanSuggestionDraft;
  };
}

interface PlanSuggestionAcceptResponse {
  data: {
    plan: ActionPlan;
    suggestion: PlanSuggestionDraft;
  };
}

export class PlansApiError extends Error {
  readonly code: string;
  readonly fields: Partial<Record<PlanFieldName, string>>;
  readonly status: number;

  constructor(status: number, payload: PlanApiErrorPayload) {
    const code = payload.error?.code ?? "REQUEST_FAILED";
    super(code);
    this.name = "PlansApiError";
    this.code = code;
    this.fields = payload.error?.fields ?? {};
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
    let payload: PlanApiErrorPayload = {};

    try {
      payload = (await response.json()) as PlanApiErrorPayload;
    } catch {
      // The status and stable code are enough for the UI.
    }

    throw new PlansApiError(response.status, payload);
  }

  return (await response.json()) as T;
}

export async function listPlansRequest(
  signal?: AbortSignal,
): Promise<ActionPlan[]> {
  const response = await requestJson<PlanListResponse>("/api/v1/plans", {
    signal,
  });

  return response.data.plans;
}

export async function createPlanRequest(
  input: CreatePlanInput,
): Promise<ActionPlan> {
  const response = await requestJson<PlanResponse>("/api/v1/plans", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data.plan;
}

export async function updatePlanStatusRequest(
  planId: string,
  status: PlanStatus,
): Promise<ActionPlan> {
  const response = await requestJson<PlanResponse>(
    `/api/v1/plans/${encodeURIComponent(planId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status } satisfies UpdatePlanInput),
    },
  );

  return response.data.plan;
}

export async function deletePlanRequest(planId: string): Promise<void> {
  await requestJson<{ data: { deleted: true } }>(
    `/api/v1/plans/${encodeURIComponent(planId)}`,
    { method: "DELETE" },
  );
}

export async function createPlanActionRequest(
  planId: string,
  input: CreatePlanActionInput,
): Promise<PlanAction> {
  const response = await requestJson<PlanActionResponse>(
    `/api/v1/plans/${encodeURIComponent(planId)}/actions`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return response.data.action;
}

export async function completePlanActionRequest(
  planId: string,
  actionId: string,
): Promise<PlanAction> {
  const response = await requestJson<PlanActionResponse>(
    `/api/v1/plans/${encodeURIComponent(planId)}/actions/${encodeURIComponent(
      actionId,
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: "done" }),
    },
  );

  return response.data.action;
}

export async function generatePlanSuggestionRequest(
  summaryWindow: 7 | 14 | 30,
  locale: AppLocale = defaultLocale,
): Promise<PlanSuggestionGenerationResult> {
  const response = await requestJson<PlanSuggestionGenerationResponse>(
    "/api/v1/plans/suggestions",
    {
      method: "POST",
      body: JSON.stringify({ locale, summaryWindow }),
    },
  );

  return response.data;
}

export async function acceptPlanSuggestionRequest(
  suggestionId: string,
): Promise<PlanSuggestionAcceptResponse["data"]> {
  const response = await requestJson<PlanSuggestionAcceptResponse>(
    `/api/v1/plans/suggestions/${encodeURIComponent(suggestionId)}/accept`,
    { method: "POST" },
  );

  return response.data;
}

export async function dismissPlanSuggestionRequest(
  suggestionId: string,
): Promise<PlanSuggestionDraft> {
  const response = await requestJson<PlanSuggestionResponse>(
    `/api/v1/plans/suggestions/${encodeURIComponent(suggestionId)}/dismiss`,
    { method: "POST" },
  );

  return response.data.suggestion;
}
