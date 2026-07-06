"use client";

import {
  CheckCircle2,
  FileText,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  LONG_TERM_SUMMARY_WINDOWS,
  type LongTermInsightDraft,
  type LongTermSummary,
  type LongTermSummaryWindow,
} from "@/features/long-term/model";
import {
  dismissLongTermInsightRequest,
  generateLongTermInsightRequest,
  getLongTermSummaryRequest,
  listLongTermInsightsRequest,
  LongTermSummaryApiError,
  saveLongTermInsightRequest,
} from "@/features/long-term/long-term-api";
import {
  formatLocalDateLong,
  formatTrendNumber,
} from "@/features/trends/format";
import type { Messages } from "@/i18n/messages";
import { useCurrentLocale, useMessages } from "@/i18n/use-messages";

function renderAverage(
  value: number | null,
  zhCN: Messages,
  locale: string,
  unit = "",
): string {
  return value === null
    ? zhCN.longTerm.noData
    : `${formatTrendNumber(value, locale)}${unit}`;
}

function renderInsightSections(insight: LongTermInsightDraft, zhCN: Messages) {
  return (
    <div className="long-term-insight-draft">
      <div>
        <h3>{insight.title}</h3>
        <p>{insight.overview}</p>
      </div>

      <section>
        <h4>{zhCN.longTerm.insights.patternsTitle}</h4>
        <ul>
          {insight.patterns.map((pattern) => (
            <li key={`${pattern.title}-${pattern.confidence}`}>
              <strong>{pattern.title}</strong>
              <span>{pattern.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4>{zhCN.longTerm.insights.strengthsTitle}</h4>
        <ul>
          {insight.strengths.map((strength) => (
            <li key={strength}>{strength}</li>
          ))}
        </ul>
      </section>

      <section>
        <h4>{zhCN.longTerm.insights.watchPointsTitle}</h4>
        <ul>
          {insight.watchPoints.map((watchPoint) => (
            <li key={watchPoint}>{watchPoint}</li>
          ))}
        </ul>
      </section>

      <section>
        <h4>{zhCN.longTerm.insights.suggestionsTitle}</h4>
        <ul>
          {insight.gentleSuggestions.map((suggestion) => (
            <li key={`${suggestion.suggestedActionType}-${suggestion.title}`}>
              <strong>{suggestion.title}</strong>
              <span>{suggestion.description}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function LongTermSummaryDashboard() {
  const locale = useCurrentLocale();
  const zhCN = useMessages();
  const router = useRouter();
  const [selectedWindow, setSelectedWindow] =
    useState<LongTermSummaryWindow>(7);
  const [summary, setSummary] = useState<LongTermSummary | null>(null);
  const [insights, setInsights] = useState<LongTermInsightDraft[]>([]);
  const [activeInsight, setActiveInsight] =
    useState<LongTermInsightDraft | null>(null);
  const [insightStatusMessage, setInsightStatusMessage] = useState<
    string | null
  >(null);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightSaving, setInsightSaving] = useState(false);
  const [insightDismissing, setInsightDismissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const redirectForAccessError = useCallback(
    (requestError: LongTermSummaryApiError): boolean => {
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

  const loadSummary = useCallback(
    async (window: LongTermSummaryWindow, signal?: AbortSignal) => {
      setLoading(true);
      setError(false);

      try {
        setSummary(await getLongTermSummaryRequest(window, locale, signal));
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
    [locale, redirectForAccessError],
  );

  useEffect(() => {
    const controller = new AbortController();

    void getLongTermSummaryRequest(selectedWindow, locale, controller.signal)
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
  }, [locale, redirectForAccessError, selectedWindow]);

  useEffect(() => {
    const controller = new AbortController();

    void listLongTermInsightsRequest(controller.signal)
      .then((result) => setInsights(result))
      .catch((requestError: unknown) => {
        if (
          requestError instanceof LongTermSummaryApiError &&
          redirectForAccessError(requestError)
        ) {
          return;
        }
      });

    return () => controller.abort();
  }, [redirectForAccessError]);

  const handleGenerateInsight = async () => {
    setInsightLoading(true);
    setInsightError(null);
    setInsightStatusMessage(null);

    try {
      const result = await generateLongTermInsightRequest(
        selectedWindow,
        locale,
      );

      if (result.status === "generated" && result.insight) {
        setActiveInsight(result.insight);
        setInsights((current) => [
          result.insight as LongTermInsightDraft,
          ...current.filter((insight) => insight.id !== result.insight?.id),
        ]);
        setInsightStatusMessage(zhCN.longTerm.insights.generatedStatus);
        return;
      }

      setActiveInsight(null);
      setInsightStatusMessage(
        result.status === "insufficient_data"
          ? zhCN.longTerm.insights.insufficientData
          : zhCN.longTerm.insights.fallback,
      );
    } catch (requestError) {
      if (
        requestError instanceof LongTermSummaryApiError &&
        requestError.code === "AI_CONSENT_REQUIRED"
      ) {
        setInsightStatusMessage(zhCN.longTerm.insights.consentRequired);
        return;
      }

      setInsightError(zhCN.longTerm.insights.errors.generic);
    } finally {
      setInsightLoading(false);
    }
  };

  const handleSaveInsight = async () => {
    if (!activeInsight) {
      return;
    }

    setInsightSaving(true);
    setInsightError(null);

    try {
      const insight = await saveLongTermInsightRequest(activeInsight.id);
      setActiveInsight(insight);
      setInsights((current) =>
        current.map((item) => (item.id === insight.id ? insight : item)),
      );
      setInsightStatusMessage(zhCN.longTerm.insights.savedStatus);
    } catch {
      setInsightError(zhCN.longTerm.insights.errors.saveFailed);
    } finally {
      setInsightSaving(false);
    }
  };

  const handleDismissInsight = async () => {
    if (!activeInsight) {
      return;
    }

    setInsightDismissing(true);
    setInsightError(null);

    try {
      const insight = await dismissLongTermInsightRequest(activeInsight.id);
      setActiveInsight(insight);
      setInsights((current) =>
        current.map((item) => (item.id === insight.id ? insight : item)),
      );
      setInsightStatusMessage(zhCN.longTerm.insights.dismissedStatus);
    } catch {
      setInsightError(zhCN.longTerm.insights.errors.dismissFailed);
    } finally {
      setInsightDismissing(false);
    }
  };

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
              <strong>
                {renderAverage(summary.moodAverage, zhCN, locale)}
              </strong>
            </div>
            <div>
              <span>{zhCN.trends.metrics.stress}</span>
              <strong>
                {renderAverage(summary.stressAverage, zhCN, locale)}
              </strong>
            </div>
            <div>
              <span>{zhCN.trends.metrics.energy}</span>
              <strong>
                {renderAverage(summary.energyAverage, zhCN, locale)}
              </strong>
            </div>
            <div>
              <span>{zhCN.trends.metrics.sleepHours}</span>
              <strong>
                {renderAverage(
                  summary.sleepAverage,
                  zhCN,
                  locale,
                  zhCN.trends.units.hours,
                )}
              </strong>
            </div>
            <div>
              <span>{zhCN.trends.metrics.sleepQuality}</span>
              <strong>
                {renderAverage(summary.sleepQualityAverage, zhCN, locale)}
              </strong>
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
                            {formatLocalDateLong(localDate, locale)}
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

          <section
            aria-labelledby="long-term-insight-title"
            className="long-term-insight-panel"
          >
            <div className="trend-summary">
              <Sparkles aria-hidden="true" size={26} />
              <div>
                <h2 id="long-term-insight-title">
                  {zhCN.longTerm.insights.title}
                </h2>
                <p>{zhCN.longTerm.insights.intro}</p>
                <p className="trend-aggregation-note">
                  {zhCN.longTerm.insights.disclaimer}
                </p>
                <p className="trend-aggregation-note">
                  {zhCN.longTerm.insights.noAutoPlan}
                </p>
              </div>
            </div>

            <div className="plan-suggestion-controls">
              <label className="field" htmlFor="long-term-insight-window">
                <span>{zhCN.plans.suggestions.windowLabel}</span>
                <select
                  id="long-term-insight-window"
                  onChange={(event) =>
                    setSelectedWindow(
                      Number(event.target.value) as LongTermSummaryWindow,
                    )
                  }
                  value={selectedWindow}
                >
                  {LONG_TERM_SUMMARY_WINDOWS.map((window) => (
                    <option key={window} value={window}>
                      {zhCN.longTerm.windowLabel(window)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="primary-button"
                disabled={insightLoading}
                onClick={() => void handleGenerateInsight()}
                type="button"
              >
                {insightLoading && (
                  <LoaderCircle
                    aria-hidden="true"
                    className="button-spinner"
                    size={18}
                  />
                )}
                {insightLoading
                  ? zhCN.longTerm.insights.generating
                  : zhCN.longTerm.insights.generate}
              </button>
            </div>

            {insightStatusMessage && (
              <div className="ai-feedback-notice" role="status">
                <CheckCircle2 aria-hidden="true" size={20} />
                <p>{insightStatusMessage}</p>
              </div>
            )}

            {insightError && (
              <div className="ai-feedback-error" role="alert">
                <XCircle aria-hidden="true" size={20} />
                <p>{insightError}</p>
              </div>
            )}

            {activeInsight && (
              <>
                {renderInsightSections(activeInsight, zhCN)}
                {activeInsight.status === "draft" && (
                  <div className="form-actions">
                    <button
                      className="secondary-button"
                      disabled={insightDismissing || insightSaving}
                      onClick={() => void handleDismissInsight()}
                      type="button"
                    >
                      {insightDismissing
                        ? zhCN.longTerm.insights.dismissing
                        : zhCN.longTerm.insights.dismiss}
                    </button>
                    <button
                      className="primary-button"
                      disabled={insightDismissing || insightSaving}
                      onClick={() => void handleSaveInsight()}
                      type="button"
                    >
                      {insightSaving
                        ? zhCN.longTerm.insights.saving
                        : zhCN.longTerm.insights.save}
                    </button>
                  </div>
                )}
              </>
            )}

            <section className="long-term-insight-history">
              <h3>{zhCN.longTerm.insights.historyTitle}</h3>
              {insights.length === 0 ? (
                <p>{zhCN.longTerm.insights.emptyHistory}</p>
              ) : (
                <ul>
                  {insights.map((insight) => (
                    <li key={insight.id}>
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setActiveInsight(insight);
                          setInsightStatusMessage(null);
                          setInsightError(null);
                        }}
                        type="button"
                      >
                        {insight.title} - {insight.status}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </section>
        </section>
      )}
    </div>
  );
}
