import type { JournalEntry } from "@/features/journal/model";

export function formatJournalDateTime(
  entry: JournalEntry,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: entry.timeZone,
  }).format(new Date(entry.occurredAt));
}

export function truncateJournalNote(
  note: string,
  maximumCharacters = 140,
): string {
  const characters = Array.from(note);

  if (characters.length <= maximumCharacters) {
    return note;
  }

  return `${characters.slice(0, maximumCharacters).join("")}…`;
}
