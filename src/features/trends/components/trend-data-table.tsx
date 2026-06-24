import type { RecentTrends } from "@/features/trends/model";
import {
  formatLocalDateLong,
  formatTrendNumber,
} from "@/features/trends/format";
import { zhCN } from "@/i18n/messages/zh-CN";

function renderValue(value: number | null, unit = ""): string {
  return value === null
    ? zhCN.trends.noData
    : `${formatTrendNumber(value)}${unit}`;
}

export function TrendDataTable({ trends }: { trends: RecentTrends }) {
  return (
    <section className="trend-table-section">
      <div className="trend-section-heading">
        <h2>{zhCN.trends.tableTitle}</h2>
        <p>{zhCN.trends.tableIntro}</p>
      </div>
      <div
        aria-label={zhCN.trends.tableRegionLabel}
        className="trend-table-scroll"
        role="region"
        tabIndex={0}
      >
        <table className="trend-table">
          <thead>
            <tr>
              <th scope="col">{zhCN.trends.table.date}</th>
              <th scope="col">{zhCN.trends.metrics.mood}</th>
              <th scope="col">{zhCN.trends.metrics.stress}</th>
              <th scope="col">{zhCN.trends.metrics.energy}</th>
              <th scope="col">{zhCN.trends.metrics.sleepHours}</th>
              <th scope="col">{zhCN.trends.metrics.sleepQuality}</th>
              <th scope="col">{zhCN.trends.table.entryCount}</th>
            </tr>
          </thead>
          <tbody>
            {trends.points.map((point) => (
              <tr data-local-date={point.localDate} key={point.localDate}>
                <th scope="row">
                  <time dateTime={point.localDate}>
                    {formatLocalDateLong(point.localDate)}
                  </time>
                </th>
                <td>{renderValue(point.mood)}</td>
                <td>{renderValue(point.stress)}</td>
                <td>{renderValue(point.energy)}</td>
                <td>
                  {renderValue(point.sleepHours, zhCN.trends.units.hours)}
                </td>
                <td>{renderValue(point.sleepQuality)}</td>
                <td>{point.entryCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
