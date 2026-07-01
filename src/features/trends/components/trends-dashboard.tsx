"use client";

import { ChartNoAxesCombined, LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { TrendDataTable } from "@/features/trends/components/trend-data-table";
import { TrendMetricChart } from "@/features/trends/components/trend-metric-chart";
import type { RecentTrends, TrendMetricId } from "@/features/trends/model";
import {
  getRecentTrendsRequest,
  TrendsApiError,
} from "@/features/trends/trends-api";
import { getTrendsViewState } from "@/features/trends/view-state";
import { useCurrentLocale, useMessages } from "@/i18n/use-messages";

export function TrendsDashboard() {
  const locale = useCurrentLocale();
  const messages = useMessages();
  const router = useRouter();
  const [trends, setTrends] = useState<RecentTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const redirectForAccessError = useCallback(
    (requestError: TrendsApiError): boolean => {
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

  const loadTrends = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(false);

      try {
        setTrends(await getRecentTrendsRequest(signal));
      } catch (requestError) {
        if (signal?.aborted) {
          return;
        }

        if (
          requestError instanceof TrendsApiError &&
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

    void getRecentTrendsRequest(controller.signal)
      .then((result) => setTrends(result))
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (
          requestError instanceof TrendsApiError &&
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
  }, [redirectForAccessError]);

  const viewState = getTrendsViewState({ error, loading, trends });
  const metricCharts: Array<{
    label: string;
    max: number;
    metric: TrendMetricId;
    min: number;
    unit: string;
  }> = [
    {
      label: messages.trends.metrics.mood,
      max: 10,
      metric: "mood",
      min: 1,
      unit: messages.trends.units.score,
    },
    {
      label: messages.trends.metrics.stress,
      max: 10,
      metric: "stress",
      min: 1,
      unit: messages.trends.units.score,
    },
    {
      label: messages.trends.metrics.energy,
      max: 10,
      metric: "energy",
      min: 1,
      unit: messages.trends.units.score,
    },
    {
      label: messages.trends.metrics.sleepHours,
      max: 24,
      metric: "sleepHours",
      min: 0,
      unit: messages.trends.units.hours,
    },
    {
      label: messages.trends.metrics.sleepQuality,
      max: 10,
      metric: "sleepQuality",
      min: 1,
      unit: messages.trends.units.score,
    },
  ];

  if (viewState === "loading") {
    return (
      <div className="journal-status" role="status">
        <LoaderCircle aria-hidden="true" className="button-spinner" size={22} />
        <p>{messages.trends.loading}</p>
      </div>
    );
  }

  if (viewState === "error" || !trends) {
    return (
      <section className="journal-empty-state" role="alert">
        <RefreshCw aria-hidden="true" size={28} />
        <h2>{messages.trends.errorTitle}</h2>
        <p>{messages.trends.errorBody}</p>
        <button
          className="secondary-button"
          onClick={() => void loadTrends()}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={18} />
          {messages.common.retryAction}
        </button>
      </section>
    );
  }

  const recordedDays = trends.points.filter(
    (point) => point.entryCount > 0,
  ).length;

  return (
    <div className="trends-dashboard">
      <section className="trend-summary" aria-labelledby="trend-summary-title">
        <ChartNoAxesCombined aria-hidden="true" size={26} />
        <div>
          <h2 id="trend-summary-title">
            {messages.trends.summaryTitle(recordedDays, trends.days)}
          </h2>
          <p>
            {messages.trends.summaryBody(trends.totalEntries, trends.timeZone)}
          </p>
          <p className="trend-aggregation-note">
            {messages.trends.aggregationNote}
          </p>
        </div>
      </section>

      {viewState === "empty" && (
        <section className="trend-empty-notice" role="status">
          <h2>{messages.trends.emptyTitle}</h2>
          <p>{messages.trends.emptyBody}</p>
        </section>
      )}

      {viewState === "ready" && (
        <div className="trend-chart-grid">
          {metricCharts.map((chart) => (
            <TrendMetricChart
              key={chart.metric}
              label={chart.label}
              max={chart.max}
              metric={chart.metric}
              min={chart.min}
              points={trends.points}
              unit={chart.unit}
            />
          ))}
        </div>
      )}

      <TrendDataTable trends={trends} />
    </div>
  );
}
