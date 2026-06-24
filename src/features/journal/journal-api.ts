import type {
  ApiErrorPayload,
  JournalEntry,
  JournalEntryList,
  JournalFieldName,
} from "@/features/journal/model";
import type { CreateJournalEntryInput } from "@/lib/validation/journal";

interface EntryResponse {
  data: {
    entry: JournalEntry;
  };
}

interface EntryListResponse {
  data: JournalEntryList;
}

export class JournalApiError extends Error {
  readonly code: string;
  readonly fields: Partial<Record<JournalFieldName, string>>;
  readonly status: number;

  constructor(
    status: number,
    payload: ApiErrorPayload,
    fallbackCode = "REQUEST_FAILED",
  ) {
    super(payload.error?.code ?? fallbackCode);
    this.name = "JournalApiError";
    this.status = status;
    this.code = payload.error?.code ?? fallbackCode;
    this.fields = payload.error?.fields ?? {};
  }
}

async function parseApiError(response: Response): Promise<JournalApiError> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    return new JournalApiError(response.status, payload);
  } catch {
    return new JournalApiError(response.status, {});
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

export async function createJournalEntryRequest(
  input: CreateJournalEntryInput,
): Promise<JournalEntry> {
  const response = await requestJson<EntryResponse>("/api/v1/entries", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data.entry;
}

export async function listJournalEntriesRequest(
  cursor?: string,
  signal?: AbortSignal,
): Promise<JournalEntryList> {
  const searchParams = new URLSearchParams({ limit: "10" });

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  const response = await requestJson<EntryListResponse>(
    `/api/v1/entries?${searchParams.toString()}`,
    { signal },
  );

  return response.data;
}

export async function getJournalEntryRequest(
  entryId: string,
  signal?: AbortSignal,
): Promise<JournalEntry> {
  const response = await requestJson<EntryResponse>(
    `/api/v1/entries/${encodeURIComponent(entryId)}`,
    { signal },
  );

  return response.data.entry;
}

export async function updateJournalEntryRequest(
  entryId: string,
  input: CreateJournalEntryInput,
): Promise<JournalEntry> {
  const response = await requestJson<EntryResponse>(
    `/api/v1/entries/${encodeURIComponent(entryId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );

  return response.data.entry;
}

export async function deleteJournalEntryRequest(
  entryId: string,
): Promise<void> {
  await requestJson<{ data: { deleted: true } }>(
    `/api/v1/entries/${encodeURIComponent(entryId)}`,
    { method: "DELETE" },
  );
}
