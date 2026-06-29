"use client";

import { FileText, LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  LONG_TERM_SUMMARY_WINDOWS,
  type LongTermSummary,
  type LongTermSummaryWindow,
} from "@/features/long-term/model";
import {
  getLongTermSummaryRequest,
  LongTermSummaryApiError,
} from "@/features/long-term/long-term-api";
import {
  formatLocalDateLong,
  formatTrendNumber,
} from "@/features/trends/format";
import { zhCN } from "@/i18n/messages/zh-CN";

function renderAverage(value: number | null, unit = ""): string {
  return value === null
    ? zhCN.longTerm.noData
    : `${formatTrendNumber(value)}${unit}`;
}

export function LongTermSummaryDashboard() {
  const router = useRouter();
  const [selectedWindow, setSelectedWindow] =
    useState<LongTermSummaryWindow>(7);
  const [summary, setSummary] = useState<LongTermSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const redirectForAccessError = useCallback(
    (requestError: LongTermSummaryApiError): boolean => {
      if (requestError.code === "UNAUTHENTICATED") {
        router.replace("/zh-CN/login");
        router.refresh();
        return true;
      }

      if (requestError.code === "CONSENT_REQUIRED") {
        router.replace("/zh-CN/onboarding/consent");
        router.refresh();
        return true;
      }

      return false;
    },
    [router],
  );

  const loadSummary = useCallback(
    async (window: LongTermSummaryWindow, signal?: AbortSignal) => {
      setLoading(true);
      setError(false);

      try {
        setSummary(await getLongTermSummaryRequest(window, signal));
      } catch (requestError) {
        if (signal?.aborted) {
          return;
        }

        if (
          requestError instanceof LongTermSummaryApiError &&
          redirectForAccessError(requestError)
        ) {
          return;
        }

        setError(true);
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

    void getLongTermSummaryRequest(selectedWindow, controller.signal)
      .then((result) => setSummary(result))
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (
          requestError instanceof LongTermSummaryApiError &&
          redirectForAccessError(requestError)
        ) {
          return;
        }

        setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [redirectForAccessError, selectedWindow]);

  return (
    <div className="long-term-dashboard">
      <div className="window-tabs" role="tablist">
        {LONG_TERM_SUMMARY_WINDOWS.map((window) => (
          <button
            aria-selected={selectedWindow === window}
            className="secondary-button"
            key={window}
            onClick={() => {
              setLoading(true);
              setError(false);
              setSelectedWindow(window);
            }}
            role="tab"
            type="button"
          >
            {zhCN.longTerm.windowLabel(window)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="journal-status" role="status">
          <LoaderCircle
            aria-hidden="true"
            className="button-spinner"
            size={22}
          />
          <p>{zhCN.longTerm.loading}</p>
        </div>
      )}

      {!loading && error && (
        <section className="journal-empty-state" role="alert">
          <RefreshCw aria-hidden="true" size={28} />
          <h2>{zhCN.longTerm.errorTitle}</h2>
          <p>{zhCN.longTerm.errorBody}</p>
          <button
            className="secondary-button"
            onClick={() => void loadSummary(selectedWindow)}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={18} />
            {zhCN.common.retryAction}
          </button>
        </section>
      )}

      {!loading && !error && summary && (
        <section
          aria-labelledby="long-term-summary-title"
          className="summary-panel"
        >
          <div className="trend-summary">
            <FileText aria-hidden="true" size={26} />
            <div>
              <h2 id="long-term-summary-title">
                {zhCN.longTerm.summaryTitle(
                  summary.summaryWindow,
                  summary.startDate,
                  summary.endDate,
                )}
              </h2>
              <p>
                {zhCN.longTerm.summaryBody(
                  summary.entryCount,
                  summary.timeZone,
                )}
              </p>
              <p className="trend-aggregation-note">
                {zhCN.longTerm.aggregationNote}
              </p>
            </div>
          </div>

          {summary.status === "insufficient_data" && (
            <div className="trend-empty-notice" role="status">
              <h2>{zhCN.longTerm.insufficientTitle}</h2>
              <p>{zhCN.longTerm.insufficientBody}</p>
            </div>
          )}

          <div className="summary-metrics">
            <div>
              <span>{zhCN.trends.metrics.mood}</span>
              <strong>{renderAverage(summary.moodAverage)}</strong>
            </div>
            <div>
              <span>{zhCN.trends.metrics.stress}</span>
              <strong>{renderAverage(summary.stressAverage)}</strong>
            </div>
            <div>
              <span>{zhCN.trends.metrics.energy}</span>
              <strong>{renderAverage(summary.energyAverage)}</strong>
            </div>
            <div>
              <span>{zhCN.trends.metrics.sleepHours}</span>
              <strong>
                {renderAverage(summary.sleepAverage, zhCN.trends.units.hours)}
              </strong>
            </div>
            <div>
              <span>{zhCN.trends.metrics.sleepQuality}</span>
              <strong>{renderAverage(summary.sleepQualityAverage)}</strong>
            </div>
          </div>

          <div className="summary-grid">
            <section>
              <h3>{zhCN.longTerm.commonTagsTitle}</h3>
              {summary.mostCommonTags.length === 0 ? (
                <p>{zhCN.longTerm.noTags}</p>
              ) : (
                <ul className="entry-tags">
                  {summary.mostCommonTags.map((tag) => (
                    <li className="entry-tag" key={tag.tag}>
                      {zhCN.journal.eventTags[tag.tag]} x {tag.count}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3>{zhCN.longTerm.patternsTitle}</h3>
              {summary.notablePatterns.length === 0 ? (
                <p>{zhCN.longTerm.noPatterns}</p>
              ) : (
                <ul>
                  {summary.notablePatterns.map((pattern) => (
                    <li key={pattern}>{pattern}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="trend-table-section">
            <div className="trend-section-heading">
              <h2>{zhCN.longTerm.missingDaysTitle}</h2>
              <p>{zhCN.longTerm.missingDaysIntro}</p>
            </div>
            <div
              aria-label={zhCN.longTerm.missingDaysRegionLabel}
              className="trend-table-scroll"
              role="region"
              tabIndex={0}
            >
              <table className="trend-table">
                <thead>
                  <tr>
                    <th scope="col">{zhCN.trends.table.date}</th>
                    <th scope="col">{zhCN.longTerm.missingState}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.missingDays.length === 0 ? (
                    <tr>
                      <td colSpan={2}>{zhCN.longTerm.noMissingDays}</td>
                    </tr>
                  ) : (
                    summary.missingDays.map((localDate) => (
                      <tr key={localDate}>
                        <th scope="row">
                          <time dateTime={localDate}>
                            {formatLocalDateLong(localDate)}
                          </time>
                        </th>
                        <td>{zhCN.longTerm.noEntryForDay}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      )}
    </div>
  );
}
