export const JOURNAL_EVENT_TAG_IDS = [
  "work",
  "job_search",
  "study",
  "sleep",
  "family",
  "relationship",
  "social",
  "finance",
  "health_routine",
  "travel",
  "other",
] as const;

export type JournalEventTagId = (typeof JOURNAL_EVENT_TAG_IDS)[number];

export const JOURNAL_EVENT_TAG_ID_SET = new Set<string>(JOURNAL_EVENT_TAG_IDS);

export const JOURNAL_MAX_EVENT_TAGS = 5;
export const JOURNAL_NOTE_MAX_CHARACTERS = 5000;

export interface JournalEntry {
  createdAt: string;
  energy: number;
  eventTags: JournalEventTagId[];
  id: string;
  localDate: string;
  mood: number;
  note: string;
  occurredAt: string;
  revision: number;
  sleepHours: number;
  sleepQuality: number;
  stress: number;
  timeZone: string;
  updatedAt: string;
}

export interface JournalEntryList {
  entries: JournalEntry[];
  nextCursor: string | null;
}

export type JournalFieldName =
  | "mood"
  | "stress"
  | "energy"
  | "sleepHours"
  | "sleepQuality"
  | "eventTags"
  | "note"
  | "occurredAt";

export type JournalFieldErrors = Partial<Record<JournalFieldName, string>>;

export interface ApiErrorPayload {
  error?: {
    code?: string;
    fields?: Partial<Record<JournalFieldName, string>>;
  };
}
