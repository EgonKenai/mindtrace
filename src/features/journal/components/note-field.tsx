"use client";

import { JOURNAL_NOTE_MAX_CHARACTERS } from "@/features/journal/model";
import { countUnicodeCharacters } from "@/features/journal/form-state";
import { useMessages } from "@/i18n/use-messages";

interface NoteFieldProps {
  error?: string;
  onChange: (value: string) => void;
  value: string;
}

export function NoteField({ error, onChange, value }: NoteFieldProps) {
  const zhCN = useMessages();
  const hintId = "journal-note-hint";
  const countId = "journal-note-count";
  const errorId = "journal-note-error";
  const characterCount = countUnicodeCharacters(value);

  return (
    <label className="journal-field journal-note-field" htmlFor="journal-note">
      <span className="journal-field-label">{zhCN.journal.form.noteLabel}</span>
      <textarea
        aria-describedby={
          error ? `${hintId} ${countId} ${errorId}` : `${hintId} ${countId}`
        }
        aria-invalid={Boolean(error)}
        id="journal-note"
        name="note"
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        value={value}
      />
      <span className="note-meta">
        <small className="field-hint" id={hintId}>
          {zhCN.journal.form.noteHint}
        </small>
        <small
          className={
            characterCount > JOURNAL_NOTE_MAX_CHARACTERS
              ? "character-count character-count-over"
              : "character-count"
          }
          id={countId}
        >
          {characterCount} / {JOURNAL_NOTE_MAX_CHARACTERS}{" "}
          {zhCN.journal.form.characters}
        </small>
      </span>
      {error && (
        <small className="field-error" id={errorId} role="alert">
          {error}
        </small>
      )}
    </label>
  );
}
