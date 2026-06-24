"use client";

import { LoaderCircle, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { EventTagSelector } from "@/features/journal/components/event-tag-selector";
import { NoteField } from "@/features/journal/components/note-field";
import { ScoreField } from "@/features/journal/components/score-field";
import { SleepHoursField } from "@/features/journal/components/sleep-hours-field";
import {
  createDefaultJournalFormValues,
  finishSubmission,
  mapApiFieldErrors,
  parseJournalFormValues,
  toggleJournalEventTag,
  tryBeginSubmission,
  type JournalEntryFormValues,
} from "@/features/journal/form-state";
import { JournalApiError } from "@/features/journal/journal-api";
import type {
  JournalEntry,
  JournalFieldErrors,
  JournalFieldName,
} from "@/features/journal/model";
import { zhCN } from "@/i18n/messages/zh-CN";
import type { CreateJournalEntryInput } from "@/lib/validation/journal";

interface JournalEntryFormProps {
  initialValues?: JournalEntryFormValues;
  mode: "create" | "edit";
  onCancel?: () => void;
  onSubmit: (input: CreateJournalEntryInput) => Promise<JournalEntry>;
  onSuccess: (entry: JournalEntry) => void;
}

const fieldErrorMessages: Record<JournalFieldName, string> = {
  mood: zhCN.journal.errors.mood,
  stress: zhCN.journal.errors.stress,
  energy: zhCN.journal.errors.energy,
  sleepHours: zhCN.journal.errors.sleepHours,
  sleepQuality: zhCN.journal.errors.sleepQuality,
  eventTags: zhCN.journal.errors.eventTags,
  note: zhCN.journal.errors.note,
  occurredAt: zhCN.journal.errors.occurredAt,
};

function getVisibleFieldErrors(errors: JournalFieldErrors): JournalFieldErrors {
  return Object.fromEntries(
    Object.keys(errors).map((field) => [
      field,
      fieldErrorMessages[field as JournalFieldName],
    ]),
  ) as JournalFieldErrors;
}

export function JournalEntryForm({
  initialValues,
  mode,
  onCancel,
  onSubmit,
  onSuccess,
}: JournalEntryFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<JournalEntryFormValues>(
    () => initialValues ?? createDefaultJournalFormValues(),
  );
  const [fieldErrors, setFieldErrors] = useState<JournalFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submissionLock = useRef(false);

  function setValue<Key extends keyof JournalEntryFormValues>(
    key: Key,
    value: JournalEntryFormValues[Key],
  ) {
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
    setFieldErrors((currentErrors) => {
      if (!currentErrors[key]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[key];
      return nextErrors;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tryBeginSubmission(submissionLock)) {
      return;
    }

    setFormError(null);
    const parsed = parseJournalFormValues(values);

    if (!parsed.success) {
      setFieldErrors(getVisibleFieldErrors(parsed.fieldErrors));
      finishSubmission(submissionLock);
      return;
    }

    setSubmitting(true);

    try {
      const entry = await onSubmit(parsed.data);
      onSuccess(entry);
    } catch (error) {
      if (error instanceof JournalApiError) {
        if (error.code === "UNAUTHENTICATED") {
          router.replace("/zh-CN/login");
          router.refresh();
          return;
        }

        if (error.code === "CONSENT_REQUIRED") {
          router.replace("/zh-CN/onboarding/consent");
          router.refresh();
          return;
        }

        const apiFieldErrors = mapApiFieldErrors({
          error: { fields: error.fields },
        });

        if (Object.keys(apiFieldErrors).length > 0) {
          setFieldErrors(getVisibleFieldErrors(apiFieldErrors));
          setFormError(zhCN.journal.errors.invalidRequest);
        } else {
          setFormError(zhCN.journal.errors.saveFailed);
        }
      } else {
        setFormError(zhCN.journal.errors.saveFailed);
      }
    } finally {
      setSubmitting(false);
      finishSubmission(submissionLock);
    }
  }

  const submitLabel =
    mode === "create"
      ? submitting
        ? zhCN.journal.actions.submitting
        : zhCN.journal.actions.submit
      : submitting
        ? zhCN.journal.actions.savingChanges
        : zhCN.journal.actions.saveChanges;

  return (
    <form className="journal-form" noValidate onSubmit={handleSubmit}>
      <div className="score-grid">
        <ScoreField
          error={fieldErrors.mood}
          hint={zhCN.journal.form.moodHint}
          id="journal-mood"
          label={zhCN.journal.form.moodLabel}
          name="mood"
          onChange={(value) => setValue("mood", value)}
          value={values.mood}
        />
        <ScoreField
          error={fieldErrors.stress}
          hint={zhCN.journal.form.stressHint}
          id="journal-stress"
          label={zhCN.journal.form.stressLabel}
          name="stress"
          onChange={(value) => setValue("stress", value)}
          value={values.stress}
        />
        <ScoreField
          error={fieldErrors.energy}
          hint={zhCN.journal.form.energyHint}
          id="journal-energy"
          label={zhCN.journal.form.energyLabel}
          name="energy"
          onChange={(value) => setValue("energy", value)}
          value={values.energy}
        />
        <ScoreField
          error={fieldErrors.sleepQuality}
          hint={zhCN.journal.form.sleepQualityHint}
          id="journal-sleep-quality"
          label={zhCN.journal.form.sleepQualityLabel}
          name="sleepQuality"
          onChange={(value) => setValue("sleepQuality", value)}
          value={values.sleepQuality}
        />
      </div>

      <div className="journal-two-column">
        <SleepHoursField
          error={fieldErrors.sleepHours}
          hint={zhCN.journal.form.sleepHoursHint}
          id="journal-sleep-hours"
          label={zhCN.journal.form.sleepHoursLabel}
          onChange={(value) => setValue("sleepHours", value)}
          value={values.sleepHours}
        />
        <label className="journal-field" htmlFor="journal-occurred-at">
          <span className="journal-field-label">
            {zhCN.journal.form.occurredAtLabel}
          </span>
          <input
            aria-describedby={
              fieldErrors.occurredAt
                ? "journal-occurred-at-hint journal-occurred-at-error"
                : "journal-occurred-at-hint"
            }
            aria-invalid={Boolean(fieldErrors.occurredAt)}
            id="journal-occurred-at"
            name="occurredAt"
            onChange={(event) => setValue("occurredAt", event.target.value)}
            required
            type="datetime-local"
            value={values.occurredAt}
          />
          <small className="field-hint" id="journal-occurred-at-hint">
            {zhCN.journal.form.occurredAtHint}
          </small>
          {fieldErrors.occurredAt && (
            <small
              className="field-error"
              id="journal-occurred-at-error"
              role="alert"
            >
              {fieldErrors.occurredAt}
            </small>
          )}
        </label>
      </div>

      <EventTagSelector
        error={fieldErrors.eventTags}
        onToggle={(tag) =>
          setValue("eventTags", toggleJournalEventTag(values.eventTags, tag))
        }
        selectedTags={values.eventTags}
      />

      <NoteField
        error={fieldErrors.note}
        onChange={(value) => setValue("note", value)}
        value={values.note}
      />

      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <div className="form-actions">
        {onCancel && (
          <button
            className="secondary-button"
            disabled={submitting}
            onClick={onCancel}
            type="button"
          >
            <X aria-hidden="true" size={18} />
            {zhCN.common.cancel}
          </button>
        )}
        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? (
            <LoaderCircle
              aria-hidden="true"
              className="button-spinner"
              size={18}
            />
          ) : (
            <Save aria-hidden="true" size={18} />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
