import { describe, expect, it } from "vitest";

import { getTrendsViewState } from "@/features/trends/view-state";
import type { RecentTrends } from "@/features/trends/model";
import type { JournalTrendRecord } from "@/server/repositories/journal-repository";
import {
  aggregateJournalTrends,
  buildRecentLocalDates,
} from "@/server/trends/aggregation";

function trendRecord(
  localDate: string,
  overrides: Partial<JournalTrendRecord> = {},
): JournalTrendRecord {
  return {
    localDate,
    mood: 5,
    stress: 4,
    energy: 6,
    sleepHours: 7.5,
    sleepQuality: 8,
    ...overrides,
  };
}

function trendsWithTotal(totalEntries: number): RecentTrends {
  return {
    days: 7,
    startDate: "2026-06-18",
    endDate: "2026-06-24",
    timeZone: "Asia/Tokyo",
    totalEntries,
    points: [],
  };
}

describe("recent trend aggregation", () => {
  it("builds the latest seven dates from the user's local date", () => {
    expect(
      buildRecentLocalDates(
        new Date("2026-06-24T06:30:00.000Z"),
        "America/Los_Angeles",
        7,
      ),
    ).toEqual([
      "2026-06-17",
      "2026-06-18",
      "2026-06-19",
      "2026-06-20",
      "2026-06-21",
      "2026-06-22",
      "2026-06-23",
    ]);
  });

  it("keeps records on opposite sides of a local midnight in separate days", () => {
    const points = aggregateJournalTrends(
      ["2026-06-23", "2026-06-24"],
      [
        trendRecord("2026-06-23", { mood: 3 }),
        trendRecord("2026-06-24", { mood: 8 }),
      ],
    );

    expect(points.map((point) => [point.localDate, point.mood])).toEqual([
      ["2026-06-23", 3],
      ["2026-06-24", 8],
    ]);
  });

  it("averages every same-day record and reports the source count", () => {
    const [point] = aggregateJournalTrends(
      ["2026-06-24"],
      [
        trendRecord("2026-06-24", {
          mood: 4,
          stress: 7,
          energy: 3,
          sleepHours: 6.25,
          sleepQuality: 5,
        }),
        trendRecord("2026-06-24", {
          mood: 8,
          stress: 3,
          energy: 9,
          sleepHours: 8,
          sleepQuality: 9,
        }),
      ],
    );

    expect(point).toEqual({
      localDate: "2026-06-24",
      entryCount: 2,
      mood: 6,
      stress: 5,
      energy: 6,
      sleepHours: 7.13,
      sleepQuality: 7,
    });
  });

  it("represents missing dates with null metrics instead of zero", () => {
    const points = aggregateJournalTrends(
      ["2026-06-22", "2026-06-23", "2026-06-24"],
      [trendRecord("2026-06-23")],
    );

    expect(points[0]).toMatchObject({
      entryCount: 0,
      mood: null,
      sleepHours: null,
    });
    expect(points[1]).toMatchObject({ entryCount: 1, mood: 5 });
    expect(points[2]).toMatchObject({
      entryCount: 0,
      mood: null,
      sleepHours: null,
    });
  });

  it("uses calendar dates across a daylight-saving transition", () => {
    expect(
      buildRecentLocalDates(
        new Date("2026-03-10T12:00:00.000Z"),
        "America/New_York",
        7,
      ),
    ).toEqual([
      "2026-03-04",
      "2026-03-05",
      "2026-03-06",
      "2026-03-07",
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
    ]);
  });

  it("uses consecutive calendar dates when daylight saving time ends", () => {
    expect(
      buildRecentLocalDates(
        new Date("2026-11-03T12:00:00.000Z"),
        "America/New_York",
        7,
      ),
    ).toEqual([
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
    ]);
  });

  it("keeps the saved localDate authoritative after a time-zone change", () => {
    const currentWindow = buildRecentLocalDates(
      new Date("2026-06-25T06:00:00.000Z"),
      "America/Los_Angeles",
      7,
    );
    const points = aggregateJournalTrends(currentWindow, [
      trendRecord("2026-06-24", { mood: 9 }),
    ]);

    expect(points.at(-1)).toMatchObject({
      localDate: "2026-06-24",
      entryCount: 1,
      mood: 9,
    });
  });

  it("selects loading, empty, failure, and ready view states", () => {
    expect(
      getTrendsViewState({ error: false, loading: true, trends: null }),
    ).toBe("loading");
    expect(
      getTrendsViewState({
        error: false,
        loading: false,
        trends: trendsWithTotal(0),
      }),
    ).toBe("empty");
    expect(
      getTrendsViewState({ error: true, loading: false, trends: null }),
    ).toBe("error");
    expect(
      getTrendsViewState({
        error: false,
        loading: false,
        trends: trendsWithTotal(2),
      }),
    ).toBe("ready");
  });
});
