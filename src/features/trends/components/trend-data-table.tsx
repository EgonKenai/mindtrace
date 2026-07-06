"use client";

import type { RecentTrends } from "@/features/trends/model";
import {
  formatLocalDateLong,
  formatTrendNumber,
} from "@/features/trends/format";
import { useCurrentLocale, useMessages } from "@/i18n/use-messages";

function renderValue(
  value: number | null,
  locale: string,
  noDataLabel: string,
  unit = "",
): string {
  return value === null
    ? noDataLabel
    : `${formatTrendNumber(value, locale)}${unit}`;
}

export function TrendDataTable({ trends }: { trends: RecentTrends }) {
  const locale = useCurrentLocale();
  const messages = useMessages();

  return (
    <section className="trend-table-section">
      <div className="trend-section-heading">
        <h2>{messages.trends.tableTitle}</h2>
        <p>{messages.trends.tableIntro}</p>
      </div>
      <div
        aria-label={messages.trends.tableRegionLabel}
        className="trend-table-scroll"
        role="region"
        tabIndex={0}
      >
        <table className="trend-table">
          <thead>
            <tr>
              <th scope="col">{messages.trends.table.date}</th>
              <th scope="col">{messages.trends.metrics.mood}</th>
              <th scope="col">{messages.trends.metrics.stress}</th>
              <th scope="col">{messages.trends.metrics.energy}</th>
              <th scope="col">{messages.trends.metrics.sleepHours}</th>
              <th scope="col">{messages.trends.metrics.sleepQuality}</th>
              <th scope="col">{messages.trends.table.entryCount}</th>
            </tr>
          </thead>
          <tbody>
            {trends.points.map((point) => (
              <tr data-local-date={point.localDate} key={point.localDate}>
                <th scope="row">
                  <time dateTime={point.localDate}>
                    {formatLocalDateLong(point.localDate, locale)}
                  </time>
                </th>
                <td>
                  {renderValue(point.mood, locale, messages.trends.noData)}
                </td>
                <td>
                  {renderValue(point.stress, locale, messages.trends.noData)}
                </td>
                <td>
                  {renderValue(point.energy, locale, messages.trends.noData)}
                </td>
                <td>
                  {renderValue(
                    point.sleepHours,
                    locale,
                    messages.trends.noData,
                    messages.trends.units.hours,
                  )}
                </td>
                <td>
                  {renderValue(
                    point.sleepQuality,
                    locale,
                    messages.trends.noData,
                  )}
                </td>
                <td>{point.entryCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
