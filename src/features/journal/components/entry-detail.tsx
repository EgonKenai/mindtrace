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
import { zhCN } from "@/i18n/messages/zh-CN";

interface EntryDetailProps {
  entryId: string;
}

type DetailError = "not-found" | "generic" | null;

function formatMetadataDate(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function EntryDetail({ entryId }: EntryDetailProps) {
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
            router.replace("/zh-CN/login");
            router.refresh();
            return;
          }

          if (requestError.code === "CONSENT_REQUIRED") {
            router.replace("/zh-CN/onboarding/consent");
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
  }, [entryId, router]);

  if (loading) {
    return (
      <div className="journal-status" role="status">
        <LoaderCircle aria-hidden="true" className="button-spinner" size={22} />
        <p>{zhCN.journal.detail.loading}</p>
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
            ? zhCN.journal.detail.notFoundTitle
            : zhCN.journal.history.errorTitle}
        </h1>
        <p>
          {notFound
            ? zhCN.journal.detail.notFoundBody
            : zhCN.journal.errors.loadFailed}
        </p>
        <Link className="secondary-button button-link" href="/zh-CN/history">
          <ArrowLeft aria-hidden="true" size={18} />
          {zhCN.journal.actions.backToHistory}
        </Link>
      </section>
    );
  }

  if (editing) {
    return (
      <>
        <div className="content-heading">
          <p className="eyebrow">{zhCN.journal.detail.eyebrow}</p>
          <h1>{zhCN.journal.detail.editTitle}</h1>
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
      <Link className="back-link" href="/zh-CN/history">
        <ArrowLeft aria-hidden="true" size={17} />
        {zhCN.journal.actions.backToHistory}
      </Link>

      <div className="detail-heading">
        <div>
          <p className="eyebrow">{zhCN.journal.detail.eyebrow}</p>
          <h1>{formatJournalDateTime(entry)}</h1>
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
            {zhCN.journal.actions.edit}
          </button>
          <DeleteEntryDialog
            onConfirm={async () => {
              try {
                await deleteJournalEntryRequest(entry.id);
                router.replace("/zh-CN/history");
                router.refresh();
              } catch (requestError) {
                if (requestError instanceof JournalApiError) {
                  if (requestError.code === "UNAUTHENTICATED") {
                    router.replace("/zh-CN/login");
                    router.refresh();
                    return;
                  }

                  if (requestError.code === "CONSENT_REQUIRED") {
                    router.replace("/zh-CN/onboarding/consent");
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
            <strong>{zhCN.journal.success.updatedTitle}</strong>
            <span>{zhCN.journal.success.updatedBody}</span>
          </div>
        </div>
      )}

      <section className="entry-detail-section">
        <dl className="detail-metrics">
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
      </section>

      <section className="entry-detail-section">
        <h2>{zhCN.journal.form.eventTagsLabel}</h2>
        <div
          className="entry-tags"
          aria-label={zhCN.journal.form.eventTagsLabel}
        >
          {entry.eventTags.map((tag) => (
            <span className="entry-tag" key={tag}>
              {zhCN.journal.eventTags[tag]}
            </span>
          ))}
        </div>
      </section>

      <section className="entry-detail-section">
        <h2>{zhCN.journal.detail.fullNote}</h2>
        <p className="entry-note-full">
          {entry.note || zhCN.journal.history.noteEmpty}
        </p>
      </section>

      <section
        className="entry-metadata"
        aria-label={zhCN.journal.detail.title}
      >
        <dl>
          <div>
            <dt>{zhCN.journal.detail.createdAt}</dt>
            <dd>{formatMetadataDate(entry.createdAt, entry.timeZone)}</dd>
          </div>
          <div>
            <dt>{zhCN.journal.detail.updatedAt}</dt>
            <dd>{formatMetadataDate(entry.updatedAt, entry.timeZone)}</dd>
          </div>
          <div>
            <dt>{zhCN.journal.detail.revision}</dt>
            <dd>{entry.revision}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
