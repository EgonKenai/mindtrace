"use client";

import {
  ChevronDown,
  History,
  LoaderCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { EntryList } from "@/features/journal/components/entry-list";
import {
  appendJournalEntries,
  getEntryListViewState,
} from "@/features/journal/form-state";
import {
  JournalApiError,
  listJournalEntriesRequest,
} from "@/features/journal/journal-api";
import type { JournalEntry } from "@/features/journal/model";
import { useCurrentLocale, useMessages } from "@/i18n/use-messages";

export function JournalHistory() {
  const router = useRouter();
  const locale = useCurrentLocale();
  const zhCN = useMessages();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialError, setInitialError] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

  const redirectForAccessError = useCallback(
    (requestError: JournalApiError): boolean => {
      if (requestError.code === "UNAUTHENTICATED") {
        router.replace(`/${locale}/login`);
        router.refresh();
        return true;
      }

      if (requestError.code === "CONSENT_REQUIRED") {
        router.replace(`/${locale}/onboarding/consent`);
        router.refresh();
        return true;
      }

      return false;
    },
    [locale, router],
  );

  const loadFirstPage = useCallback(
    async (signal?: AbortSignal) => {
      await Promise.resolve();
      setLoading(true);
      setInitialError(false);

      try {
        const result = await listJournalEntriesRequest(undefined, signal);
        setEntries(result.entries);
        setNextCursor(result.nextCursor);
      } catch (requestError) {
        if (signal?.aborted) {
          return;
        }

        if (
          requestError instanceof JournalApiError &&
          redirectForAccessError(requestError)
        ) {
          return;
        }

        setInitialError(true);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [redirectForAccessError],
  );

  useEffect(() => {
    const controller = new AbortController();

    void listJournalEntriesRequest(undefined, controller.signal)
      .then((result) => {
        setEntries(result.entries);
        setNextCursor(result.nextCursor);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (
          requestError instanceof JournalApiError &&
          redirectForAccessError(requestError)
        ) {
          return;
        }

        setInitialError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [redirectForAccessError]);

  async function loadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setLoadMoreError(false);

    try {
      const result = await listJournalEntriesRequest(nextCursor);
      setEntries((currentEntries) =>
        appendJournalEntries(currentEntries, result.entries),
      );
      setNextCursor(result.nextCursor);
    } catch (requestError) {
      if (
        requestError instanceof JournalApiError &&
        redirectForAccessError(requestError)
      ) {
        return;
      }

      setLoadMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  const viewState = getEntryListViewState({
    entryCount: entries.length,
    error: initialError,
    loading,
  });

  if (viewState === "loading") {
    return (
      <div className="journal-status" role="status">
        <LoaderCircle aria-hidden="true" className="button-spinner" size={22} />
        <p>{zhCN.journal.history.loading}</p>
      </div>
    );
  }

  if (viewState === "error") {
    return (
      <section className="journal-empty-state" role="alert">
        <RefreshCw aria-hidden="true" size={28} />
        <h2>{zhCN.journal.history.errorTitle}</h2>
        <p>{zhCN.journal.errors.loadFailed}</p>
        <button
          className="secondary-button"
          onClick={() => void loadFirstPage()}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={18} />
          {zhCN.common.retryAction}
        </button>
      </section>
    );
  }

  if (viewState === "empty") {
    return (
      <section className="journal-empty-state">
        <History aria-hidden="true" size={30} />
        <h2>{zhCN.journal.history.emptyTitle}</h2>
        <p>{zhCN.journal.history.emptyBody}</p>
        <Link className="primary-button button-link" href={`/${locale}/today`}>
          <Plus aria-hidden="true" size={18} />
          {zhCN.journal.actions.submit}
        </Link>
      </section>
    );
  }

  return (
    <>
      <EntryList entries={entries} />
      <div className="pagination-actions">
        {loadMoreError && (
          <p className="form-error" role="alert">
            {zhCN.journal.errors.loadFailed}
          </p>
        )}
        {nextCursor ? (
          <button
            className="secondary-button"
            disabled={loadingMore}
            onClick={() => void loadMore()}
            type="button"
          >
            {loadingMore ? (
              <LoaderCircle
                aria-hidden="true"
                className="button-spinner"
                size={18}
              />
            ) : (
              <ChevronDown aria-hidden="true" size={18} />
            )}
            {loadingMore
              ? zhCN.journal.actions.loadingMore
              : zhCN.journal.actions.loadMore}
          </button>
        ) : (
          <p className="pagination-complete">{zhCN.journal.history.noMore}</p>
        )}
      </div>
    </>
  );
}
