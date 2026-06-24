import type { ZodIssue } from "zod";

import {
  JOURNAL_MAX_EVENT_TAGS,
  type ApiErrorPayload,
  type JournalEntry,
  type JournalEventTagId,
  type JournalFieldErrors,
  type JournalFieldName,
} from "@/features/journal/model";
import {
  createJournalEntryInputSchema,
  type CreateJournalEntryInput,
} from "@/lib/validation/journal";

export interface JournalEntryFormValues {
  energy: string;
  eventTags: JournalEventTagId[];
  mood: string;
  note: string;
  occurredAt: string;
  sleepHours: string;
  sleepQuality: string;
  stress: string;
}

export type JournalFormParseResult =
  | {
      data: CreateJournalEntryInput;
      success: true;
    }
  | {
      fieldErrors: JournalFieldErrors;
      success: false;
    };

export interface SubmissionLock {
  current: boolean;
}

export type EntryListViewState = "loading" | "error" | "empty" | "ready";

export interface DeleteDialogState {
  open: boolean;
  deleting: boolean;
}

export type DeleteDialogAction =
  | { type: "open" }
  | { type: "cancel" }
  | { type: "confirm" }
  | { type: "failure" }
  | { type: "finish" };

const journalFieldNames = new Set<JournalFieldName>([
  "mood",
  "stress",
  "energy",
  "sleepHours",
  "sleepQuality",
  "eventTags",
  "note",
  "occurredAt",
]);

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

function toNumber(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value);
}

function getFieldName(issue: ZodIssue): JournalFieldName | null {
  const field = issue.path[0];
  const candidate = field as JournalFieldName;
  return typeof field === "string" && journalFieldNames.has(candidate)
    ? candidate
    : null;
}

export function toDateTimeLocalValue(date: Date): string {
  return [
    date.getFullYear(),
    "-",
    padDatePart(date.getMonth() + 1),
    "-",
    padDatePart(date.getDate()),
    "T",
    padDatePart(date.getHours()),
    ":",
    padDatePart(date.getMinutes()),
  ].join("");
}

export function createDefaultJournalFormValues(
  now = new Date(),
): JournalEntryFormValues {
  return {
    mood: "5",
    stress: "5",
    energy: "5",
    sleepHours: "8",
    sleepQuality: "5",
    eventTags: [],
    note: "",
    occurredAt: toDateTimeLocalValue(now),
  };
}

export function journalEntryToFormValues(
  entry: JournalEntry,
): JournalEntryFormValues {
  return {
    mood: String(entry.mood),
    stress: String(entry.stress),
    energy: String(entry.energy),
    sleepHours: String(entry.sleepHours),
    sleepQuality: String(entry.sleepQuality),
    eventTags: entry.eventTags,
    note: entry.note,
    occurredAt: toDateTimeLocalValue(new Date(entry.occurredAt)),
  };
}

export function countUnicodeCharacters(value: string): number {
  return Array.from(value).length;
}

export function toggleJournalEventTag(
  selectedTags: JournalEventTagId[],
  tag: JournalEventTagId,
): JournalEventTagId[] {
  if (selectedTags.includes(tag)) {
    return selectedTags.filter((selectedTag) => selectedTag !== tag);
  }

  if (selectedTags.length >= JOURNAL_MAX_EVENT_TAGS) {
    return selectedTags;
  }

  return [...selectedTags, tag];
}

export function parseJournalFormValues(
  values: JournalEntryFormValues,
): JournalFormParseResult {
  const occurredAtDate = new Date(values.occurredAt);
  const candidate = {
    mood: toNumber(values.mood),
    stress: toNumber(values.stress),
    energy: toNumber(values.energy),
    sleepHours: toNumber(values.sleepHours),
    sleepQuality: toNumber(values.sleepQuality),
    eventTags: values.eventTags,
    note: values.note,
    occurredAt: Number.isNaN(occurredAtDate.getTime())
      ? values.occurredAt
      : occurredAtDate.toISOString(),
  };
  const result = createJournalEntryInputSchema.safeParse(candidate);

  if (result.success) {
    return {
      data: result.data,
      success: true,
    };
  }

  const fieldErrors: JournalFieldErrors = {};

  for (const issue of result.error.issues) {
    const field = getFieldName(issue);

    if (field) {
      fieldErrors[field] = "INVALID_VALUE";
    }
  }

  return {
    fieldErrors,
    success: false,
  };
}

export function mapApiFieldErrors(
  payload: ApiErrorPayload,
): JournalFieldErrors {
  const fieldErrors: JournalFieldErrors = {};

  for (const field of journalFieldNames) {
    if (payload.error?.fields?.[field]) {
      fieldErrors[field] = payload.error.fields[field];
    }
  }

  return fieldErrors;
}

export function tryBeginSubmission(lock: SubmissionLock): boolean {
  if (lock.current) {
    return false;
  }

  lock.current = true;
  return true;
}

export function finishSubmission(lock: SubmissionLock): void {
  lock.current = false;
}

export function appendJournalEntries(
  currentEntries: JournalEntry[],
  incomingEntries: JournalEntry[],
): JournalEntry[] {
  const entriesById = new Map(
    currentEntries.map((entry) => [entry.id, entry] as const),
  );

  for (const entry of incomingEntries) {
    if (!entriesById.has(entry.id)) {
      entriesById.set(entry.id, entry);
    }
  }

  return Array.from(entriesById.values());
}

export function getEntryListViewState(input: {
  entryCount: number;
  error: boolean;
  loading: boolean;
}): EntryListViewState {
  if (input.loading) {
    return "loading";
  }

  if (input.error) {
    return "error";
  }

  return input.entryCount === 0 ? "empty" : "ready";
}

export function deleteDialogReducer(
  state: DeleteDialogState,
  action: DeleteDialogAction,
): DeleteDialogState {
  switch (action.type) {
    case "open":
      return { open: true, deleting: false };
    case "cancel":
      return state.deleting ? state : { open: false, deleting: false };
    case "confirm":
      return state.open ? { open: true, deleting: true } : state;
    case "failure":
      return { open: true, deleting: false };
    case "finish":
      return { open: false, deleting: false };
  }
}
