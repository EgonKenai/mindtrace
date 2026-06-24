import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  formatJournalDateTime,
  truncateJournalNote,
} from "@/features/journal/display";
import type { JournalEntry } from "@/features/journal/model";
import { zhCN } from "@/i18n/messages/zh-CN";

interface EntryCardProps {
  entry: JournalEntry;
}

export function EntryCard({ entry }: EntryCardProps) {
  const notePreview = truncateJournalNote(entry.note);

  return (
    <article className="entry-card">
      <div className="entry-card-header">
        <div>
          <p className="entry-local-date">{formatJournalDateTime(entry)}</p>
          <p className="entry-time-zone">{entry.timeZone}</p>
        </div>
        <Link
          aria-label={`${zhCN.journal.actions.viewEntry} ${formatJournalDateTime(entry)}`}
          className="entry-card-link"
          href={`/zh-CN/entries/${entry.id}`}
        >
          <span>{zhCN.journal.actions.viewEntry}</span>
          <ChevronRight aria-hidden="true" size={18} />
        </Link>
      </div>

      <dl className="entry-metrics">
        <div>
          <dt>{zhCN.journal.form.moodLabel}</dt>
          <dd>{entry.mood}</dd>
        </div>
        <div>
          <dt>{zhCN.journal.form.stressLabel}</dt>
          <dd>{entry.stress}</dd>
        </div>
        <div>
          <dt>{zhCN.journal.form.energyLabel}</dt>
          <dd>{entry.energy}</dd>
        </div>
        <div>
          <dt>{zhCN.journal.form.sleepHoursLabel}</dt>
          <dd>
            {entry.sleepHours} {zhCN.journal.form.hoursUnit}
          </dd>
        </div>
        <div>
          <dt>{zhCN.journal.form.sleepQualityLabel}</dt>
          <dd>{entry.sleepQuality}</dd>
        </div>
      </dl>

      <div className="entry-tags" aria-label={zhCN.journal.form.eventTagsLabel}>
        {entry.eventTags.map((tag) => (
          <span className="entry-tag" key={tag}>
            {zhCN.journal.eventTags[tag]}
          </span>
        ))}
      </div>

      <p className={notePreview ? "entry-note-preview" : "entry-note-empty"}>
        {notePreview || zhCN.journal.history.noteEmpty}
      </p>
    </article>
  );
}
