"use client";

import {
  JOURNAL_EVENT_TAG_IDS,
  JOURNAL_MAX_EVENT_TAGS,
  type JournalEventTagId,
} from "@/features/journal/model";
import { useMessages } from "@/i18n/use-messages";

interface EventTagSelectorProps {
  error?: string;
  onToggle: (tag: JournalEventTagId) => void;
  selectedTags: JournalEventTagId[];
}

export function EventTagSelector({
  error,
  onToggle,
  selectedTags,
}: EventTagSelectorProps) {
  const zhCN = useMessages();
  const atLimit = selectedTags.length >= JOURNAL_MAX_EVENT_TAGS;
  const errorId = "event-tags-error";
  const hintId = "event-tags-hint";

  return (
    <fieldset
      aria-describedby={error ? `${hintId} ${errorId}` : hintId}
      aria-invalid={Boolean(error)}
      className="journal-field tag-fieldset"
    >
      <legend className="journal-field-label">
        {zhCN.journal.form.eventTagsLabel}
      </legend>
      <small className="field-hint" id={hintId}>
        {zhCN.journal.form.eventTagsHint}
      </small>
      <div className="tag-selector">
        {JOURNAL_EVENT_TAG_IDS.map((tag) => {
          const checked = selectedTags.includes(tag);

          return (
            <label className="tag-option" key={tag}>
              <input
                checked={checked}
                disabled={!checked && atLimit}
                name="eventTags"
                onChange={() => onToggle(tag)}
                type="checkbox"
                value={tag}
              />
              <span>{zhCN.journal.eventTags[tag]}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <small className="field-error" id={errorId} role="alert">
          {error}
        </small>
      )}
    </fieldset>
  );
}
