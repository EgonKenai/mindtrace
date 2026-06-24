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
