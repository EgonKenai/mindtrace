"use client";

import { ArrowRight, CheckCircle2, History, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { JournalEntryForm } from "@/features/journal/components/journal-entry-form";
import { createJournalEntryRequest } from "@/features/journal/journal-api";
import type { JournalEntry } from "@/features/journal/model";
import { useCurrentLocale, useMessages } from "@/i18n/use-messages";

export function TodayJournal() {
  const locale = useCurrentLocale();
  const zhCN = useMessages();
  const [createdEntry, setCreatedEntry] = useState<JournalEntry | null>(null);
  const [formKey, setFormKey] = useState(0);

  if (createdEntry) {
    return (
      <section className="journal-success" aria-live="polite">
        <CheckCircle2 aria-hidden="true" size={28} />
        <div>
          <h2>{zhCN.journal.success.title}</h2>
          <p>{zhCN.journal.success.body}</p>
          <div className="success-actions">
            <Link
              className="primary-button button-link"
              href={`/${locale}/entries/${createdEntry.id}`}
            >
              {zhCN.journal.actions.viewEntry}
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <button
              className="secondary-button"
              onClick={() => {
                setCreatedEntry(null);
                setFormKey((currentKey) => currentKey + 1);
              }}
              type="button"
            >
              <Plus aria-hidden="true" size={18} />
              {zhCN.journal.actions.continueEntry}
            </button>
            <Link
              className="secondary-button button-link"
              href={`/${locale}/history`}
            >
              <History aria-hidden="true" size={18} />
              {zhCN.journal.actions.viewHistory}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <JournalEntryForm
      key={formKey}
      mode="create"
      onSubmit={createJournalEntryRequest}
      onSuccess={setCreatedEntry}
    />
  );
}
