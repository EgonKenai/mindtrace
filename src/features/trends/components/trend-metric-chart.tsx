"use client";

import type { CSSProperties } from "react";

import type { DailyTrendPoint, TrendMetricId } from "@/features/trends/model";
import { formatLocalDate, formatTrendNumber } from "@/features/trends/format";
import { useMessages } from "@/i18n/use-messages";

interface TrendMetricChartProps {
  label: string;
  max: number;
  metric: TrendMetricId;
  min: number;
  points: DailyTrendPoint[];
  unit: string;
}

export function TrendMetricChart({
  label,
  max,
  metric,
  min,
  points,
  unit,
}: TrendMetricChartProps) {
  const messages = useMessages();

  return (
    <section
      aria-label={messages.trends.chartAriaLabel(label)}
      className={`trend-metric-card trend-metric-${metric}`}
    >
      <div className="trend-metric-heading">
        <h2>{label}</h2>
        <span>{messages.trends.scaleLabel(min, max, unit)}</span>
      </div>
      <div className="trend-plot" role="list">
        {points.map((point) => {
          const value = point[metric];
          const valueText =
            value === null
              ? messages.trends.noData
              : `${formatTrendNumber(value)}${unit}`;
          const style = {
            "--trend-height": `${value === null ? 0 : (value / max) * 100}%`,
          } as CSSProperties;

          return (
            <div
              aria-label={messages.trends.pointAriaLabel(
                formatLocalDate(point.localDate),
                valueText,
              )}
              className="trend-column"
              key={point.localDate}
              role="listitem"
            >
              <span className="trend-value">{valueText}</span>
              <div aria-hidden="true" className="trend-bar-track">
                {value !== null && <span className="trend-bar" style={style} />}
              </div>
              <time dateTime={point.localDate}>
                {formatLocalDate(point.localDate)}
              </time>
            </div>
          );
        })}
      </div>
    </section>
  );
}
