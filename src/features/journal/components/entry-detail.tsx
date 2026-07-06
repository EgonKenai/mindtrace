"use client";

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Pencil,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EntryAiFeedback } from "@/features/ai-feedback/components/entry-ai-feedback";
import { DeleteEntryDialog } from "@/features/journal/components/delete-entry-dialog";
import { JournalEntryForm } from "@/features/journal/components/journal-entry-form";
import { formatJournalDateTime } from "@/features/journal/display";
import { journalEntryToFormValues } from "@/features/journal/form-state";
import {
  deleteJournalEntryRequest,
  getJournalEntryRequest,
  JournalApiError,
  updateJournalEntryRequest,
} from "@/features/journal/journal-api";
import type { JournalEntry } from "@/features/journal/model";
import { useCurrentLocale, useMessages } from "@/i18n/use-messages";

interface EntryDetailProps {
  entryId: string;
}

type DetailError = "not-found" | "generic" | null;

function formatMetadataDate(
  value: string,
  timeZone: string,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function EntryDetail({ entryId }: EntryDetailProps) {
  const locale = useCurrentLocale();
  const messages = useMessages();
  const router = useRouter();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DetailError>(null);
  const [editing, setEditing] = useState(false);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEntry() {
      setLoading(true);
      setError(null);

      try {
        const result = await getJournalEntryRequest(entryId, controller.signal);
        setEntry(result);
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        if (requestError instanceof JournalApiError) {
          if (requestError.code === "UNAUTHENTICATED") {
            router.replace(`/${locale}/login`);
            router.refresh();
            return;
          }

          if (requestError.code === "CONSENT_REQUIRED") {
            router.replace(`/${locale}/onboarding/consent`);
            router.refresh();
            return;
          }

          if (requestError.code === "NOT_FOUND") {
            setError("not-found");
            return;
          }
        }

        setError("generic");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadEntry();
    return () => controller.abort();
  }, [entryId, locale, router]);

  if (loading) {
    return (
      <div className="journal-status" role="status">
        <LoaderCircle aria-hidden="true" className="button-spinner" size={22} />
        <p>{messages.journal.detail.loading}</p>
      </div>
    );
  }

  if (error || !entry) {
    const notFound = error === "not-found";

    return (
      <section className="journal-empty-state" role="alert">
        <RefreshCw aria-hidden="true" size={28} />
        <h1>
          {notFound
            ? messages.journal.detail.notFoundTitle
            : messages.journal.history.errorTitle}
        </h1>
        <p>
          {notFound
            ? messages.journal.detail.notFoundBody
            : messages.journal.errors.loadFailed}
        </p>
        <Link
          className="secondary-button button-link"
          href={`/${locale}/history`}
        >
          <ArrowLeft aria-hidden="true" size={18} />
          {messages.journal.actions.backToHistory}
        </Link>
      </section>
    );
  }

  if (editing) {
    return (
      <>
        <div className="content-heading">
          <p className="eyebrow">{messages.journal.detail.eyebrow}</p>
          <h1>{messages.journal.detail.editTitle}</h1>
        </div>
        <JournalEntryForm
          initialValues={journalEntryToFormValues(entry)}
          key={entry.revision}
          mode="edit"
          onCancel={() => setEditing(false)}
          onSubmit={(input) => updateJournalEntryRequest(entry.id, input)}
          onSuccess={(updatedEntry) => {
            setEntry(updatedEntry);
            setEditing(false);
            setUpdated(true);
          }}
        />
      </>
    );
  }

  return (
    <>
      <Link className="back-link" href={`/${locale}/history`}>
        <ArrowLeft aria-hidden="true" size={17} />
        {messages.journal.actions.backToHistory}
      </Link>

      <div className="detail-heading">
        <div>
          <p className="eyebrow">{messages.journal.detail.eyebrow}</p>
          <h1>{formatJournalDateTime(entry, locale)}</h1>
          <p>{entry.timeZone}</p>
        </div>
        <div className="detail-actions">
          <button
            className="secondary-button"
            onClick={() => {
              setUpdated(false);
              setEditing(true);
            }}
            type="button"
          >
            <Pencil aria-hidden="true" size={18} />
            {messages.journal.actions.edit}
          </button>
          <DeleteEntryDialog
            onConfirm={async () => {
              try {
                await deleteJournalEntryRequest(entry.id);
                router.replace(`/${locale}/history`);
                router.refresh();
              } catch (requestError) {
                if (requestError instanceof JournalApiError) {
                  if (requestError.code === "UNAUTHENTICATED") {
                    router.replace(`/${locale}/login`);
                    router.refresh();
                    return;
                  }

                  if (requestError.code === "CONSENT_REQUIRED") {
                    router.replace(`/${locale}/onboarding/consent`);
                    router.refresh();
                    return;
                  }
                }

                throw requestError;
              }
            }}
          />
        </div>
      </div>

      {updated && (
        <div className="inline-success" role="status">
          <CheckCircle2 aria-hidden="true" size={20} />
          <div>
            <strong>{messages.journal.success.updatedTitle}</strong>
            <span>{messages.journal.success.updatedBody}</span>
          </div>
        </div>
      )}

      <section className="entry-detail-section">
        <dl className="detail-metrics">
          <div>
            <dt>{messages.journal.form.moodLabel}</dt>
            <dd>{entry.mood}</dd>
          </div>
          <div>
            <dt>{messages.journal.form.stressLabel}</dt>
            <dd>{entry.stress}</dd>
          </div>
          <div>
            <dt>{messages.journal.form.energyLabel}</dt>
            <dd>{entry.energy}</dd>
          </div>
          <div>
            <dt>{messages.journal.form.sleepHoursLabel}</dt>
            <dd>
              {entry.sleepHours} {messages.journal.form.hoursUnit}
            </dd>
          </div>
          <div>
            <dt>{messages.journal.form.sleepQualityLabel}</dt>
            <dd>{entry.sleepQuality}</dd>
          </div>
        </dl>
      </section>

      <section className="entry-detail-section">
        <h2>{messages.journal.form.eventTagsLabel}</h2>
        <div
          className="entry-tags"
          aria-label={messages.journal.form.eventTagsLabel}
        >
          {entry.eventTags.map((tag) => (
            <span className="entry-tag" key={tag}>
              {messages.journal.eventTags[tag]}
            </span>
          ))}
        </div>
      </section>

      <section className="entry-detail-section">
        <h2>{messages.journal.detail.fullNote}</h2>
        <p className="entry-note-full">
          {entry.note || messages.journal.history.noteEmpty}
        </p>
      </section>

      <EntryAiFeedback entryId={entry.id} />

      <section
        className="entry-metadata"
        aria-label={messages.journal.detail.title}
      >
        <dl>
          <div>
            <dt>{messages.journal.detail.createdAt}</dt>
            <dd>
              {formatMetadataDate(entry.createdAt, entry.timeZone, locale)}
            </dd>
          </div>
          <div>
            <dt>{messages.journal.detail.updatedAt}</dt>
            <dd>
              {formatMetadataDate(entry.updatedAt, entry.timeZone, locale)}
            </dd>
          </div>
          <div>
            <dt>{messages.journal.detail.revision}</dt>
            <dd>{entry.revision}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
