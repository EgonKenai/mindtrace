import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JournalSummaryRecord } from "@/server/repositories/journal-repository";

const mocks = vi.hoisted(() => ({
  listJournalSummaryRecords: vi.fn(),
  requireProductDataAccess: vi.fn(),
}));

vi.mock("@/server/repositories/journal-repository", () => ({
  listJournalSummaryRecords: mocks.listJournalSummaryRecords,
}));

vi.mock("@/server/services/product-access-service", () => ({
  requireProductDataAccess: mocks.requireProductDataAccess,
}));

const { getLongTermSummary } =
  await import("@/server/services/long-term-summary-service");

function summaryRecord(
  localDate: string,
  overrides: Partial<JournalSummaryRecord> = {},
): JournalSummaryRecord {
  return {
    energy: 6,
    eventTags: ["study"],
    localDate,
    mood: 5,
    sleepHours: 7,
    sleepQuality: 6,
    stress: 4,
    ...overrides,
  };
}

describe("long-term summary service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireProductDataAccess.mockResolvedValue({
      timeZone: "Asia/Tokyo",
      userId: "server-user",
    });
  });

  it("calculates a seven-day local-date window", async () => {
    mocks.listJournalSummaryRecords.mockResolvedValue([
      summaryRecord("2026-06-24"),
    ]);

    const summary = await getLongTermSummary(
      "server-user",
      { window: "7" },
      new Date("2026-06-24T12:00:00.000Z"),
    );

    expect(summary).toMatchObject({
      summaryWindow: 7,
      startDate: "2026-06-18",
      endDate: "2026-06-24",
      status: "ready",
    });
    expect(mocks.listJournalSummaryRecords).toHaveBeenCalledWith(
      "server-user",
      "2026-06-18",
      "2026-06-24",
    );
  });

  it("calculates fourteen-day and thirty-day windows", async () => {
    mocks.listJournalSummaryRecords.mockResolvedValue([
      summaryRecord("2026-06-24"),
    ]);

    await expect(
      getLongTermSummary(
        "server-user",
        { window: "14" },
        new Date("2026-06-24T12:00:00.000Z"),
      ),
    ).resolves.toMatchObject({
      summaryWindow: 14,
      startDate: "2026-06-11",
      endDate: "2026-06-24",
    });
    await expect(
      getLongTermSummary(
        "server-user",
        { window: "30" },
        new Date("2026-06-24T12:00:00.000Z"),
      ),
    ).resolves.toMatchObject({
      summaryWindow: 30,
      startDate: "2026-05-26",
      endDate: "2026-06-24",
    });
  });

  it("keeps localDate authoritative across time zones", async () => {
    mocks.requireProductDataAccess.mockResolvedValue({
      timeZone: "America/Los_Angeles",
      userId: "server-user",
    });
    mocks.listJournalSummaryRecords.mockResolvedValue([
      summaryRecord("2026-06-23"),
    ]);

    const summary = await getLongTermSummary(
      "server-user",
      { window: "7" },
      new Date("2026-06-24T06:30:00.000Z"),
    );

    expect(summary.endDate).toBe("2026-06-23");
    expect(summary.missingDays).not.toContain("2026-06-23");
  });

  it("returns insufficient_data with null averages when there are no records", async () => {
    mocks.listJournalSummaryRecords.mockResolvedValue([]);

    const summary = await getLongTermSummary(
      "server-user",
      { window: "7" },
      new Date("2026-06-24T12:00:00.000Z"),
    );

    expect(summary).toMatchObject({
      entryCount: 0,
      moodAverage: null,
      status: "insufficient_data",
    });
    expect(summary.missingDays).toHaveLength(7);
  });

  it("averages metrics and sorts common tags deterministically", async () => {
    mocks.listJournalSummaryRecords.mockResolvedValue([
      summaryRecord("2026-06-23", {
        eventTags: ["sleep", "study"],
        mood: 4,
        sleepHours: 6.25,
        stress: 7,
      }),
      summaryRecord("2026-06-24", {
        eventTags: ["study", "work"],
        mood: 8,
        sleepHours: 8,
        stress: 3,
      }),
    ]);

    const summary = await getLongTermSummary(
      "server-user",
      { window: "7" },
      new Date("2026-06-24T12:00:00.000Z"),
    );

    expect(summary).toMatchObject({
      entryCount: 2,
      moodAverage: 6,
      sleepAverage: 7.13,
      stressAverage: 5,
    });
    expect(summary.mostCommonTags).toEqual([
      { tag: "study", count: 2 },
      { tag: "sleep", count: 1 },
      { tag: "work", count: 1 },
    ]);
  });

  it("does not include complete journal text and only uses server-scoped uid", async () => {
    const fictionalNote = "fictional note text that must never be copied";
    mocks.listJournalSummaryRecords.mockResolvedValue([
      summaryRecord("2026-06-24"),
    ]);

    const summary = await getLongTermSummary(
      "client-user-should-not-win",
      { window: "7" },
      new Date("2026-06-24T12:00:00.000Z"),
    );

    expect(JSON.stringify(summary)).not.toContain(fictionalNote);
    expect(JSON.stringify(summary)).not.toContain("client-user-should-not-win");
    expect(mocks.requireProductDataAccess).toHaveBeenCalledWith(
      "client-user-should-not-win",
    );
    expect(mocks.listJournalSummaryRecords).toHaveBeenCalledWith(
      "server-user",
      expect.any(String),
      expect.any(String),
    );
  });
});
