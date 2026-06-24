import type { JournalEntry } from "@/features/journal/model";

import { EntryCard } from "./entry-card";

interface EntryListProps {
  entries: JournalEntry[];
}

export function EntryList({ entries }: EntryListProps) {
  return (
    <div className="entry-list">
      {entries.map((entry) => (
        <EntryCard entry={entry} key={entry.id} />
      ))}
    </div>
  );
}
