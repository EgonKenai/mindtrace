import { describe, expect, it } from "vitest";

import {
  appendJournalEntries,
  countUnicodeCharacters,
  createDefaultJournalFormValues,
  deleteDialogReducer,
  finishSubmission,
  getEntryListViewState,
  mapApiFieldErrors,
  parseJournalFormValues,
  toggleJournalEventTag,
  tryBeginSubmission,
  type JournalEntryFormValues,
} from "@/features/journal/form-state";
import type { JournalEntry } from "@/features/journal/model";

const validFormValues: JournalEntryFormValues = {
  mood: "5",
  stress: "4",
  energy: "6",
  sleepHours: "7.5",
  sleepQuality: "8",
  eventTags: ["work", "sleep"],
  note: "完全虚构的表单测试记录。",
  occurredAt: "2026-06-24T09:30",
};

function createEntry(id: string, note: string): JournalEntry {
  return {
    id,
    mood: 5,
    stress: 4,
    energy: 6,
    sleepHours: 7.5,
    sleepQuality: 8,
    eventTags: ["work"],
    note,
    occurredAt: "2026-06-24T00:30:00.000Z",
    localDate: "2026-06-24",
    timeZone: "Asia/Tokyo",
    createdAt: "2026-06-24T00:31:00.000Z",
    updatedAt: "2026-06-24T00:31:00.000Z",
    revision: 1,
  };
}

describe("journal form state", () => {
  it("converts form values into the existing API request shape", () => {
    const result = parseJournalFormValues(validFormValues);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data).toMatchObject({
      mood: 5,
      stress: 4,
      energy: 6,
      sleepHours: 7.5,
      sleepQuality: 8,
      eventTags: ["work", "sleep"],
      note: "完全虚构的表单测试记录。",
    });
    expect(new Date(result.data.occurredAt).getTime()).toBe(
      new Date(validFormValues.occurredAt).getTime(),
    );
  });

  it("accepts score boundaries and fractional sleep hours", () => {
    const result = parseJournalFormValues({
      ...validFormValues,
      mood: "1",
      stress: "10",
      energy: "1",
      sleepHours: "6.25",
      sleepQuality: "10",
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        mood: 1,
        stress: 10,
        energy: 1,
        sleepHours: 6.25,
        sleepQuality: 10,
      },
    });
  });

  it("maps invalid numeric fields back to their form fields", () => {
    const result = parseJournalFormValues({
      ...validFormValues,
      mood: "10.5",
      sleepHours: "24.1",
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: {
        mood: "INVALID_VALUE",
        sleepHours: "INVALID_VALUE",
      },
    });
  });

  it("selects and cancels controlled event tags without duplicates", () => {
    const selected = toggleJournalEventTag([], "work");
    expect(selected).toEqual(["work"]);
    expect(toggleJournalEventTag(selected, "work")).toEqual([]);
  });

  it("does not select more than five event tags", () => {
    const selected = [
      "work",
      "job_search",
      "study",
      "sleep",
      "family",
    ] as const;

    expect(toggleJournalEventTag([...selected], "relationship")).toEqual(
      selected,
    );
  });

  it("counts Unicode code points for the note counter", () => {
    expect(countUnicodeCharacters("记录🙂")).toBe(3);
    expect(countUnicodeCharacters("好".repeat(5000))).toBe(5000);
  });

  it("maps safe API field errors to matching form fields", () => {
    expect(
      mapApiFieldErrors({
        error: {
          code: "INVALID_REQUEST",
          fields: {
            mood: "INVALID_VALUE",
            note: "INVALID_VALUE",
          },
        },
      }),
    ).toEqual({
      mood: "INVALID_VALUE",
      note: "INVALID_VALUE",
    });
  });

  it("prevents a second submission until the current request finishes", () => {
    const lock = { current: false };

    expect(tryBeginSubmission(lock)).toBe(true);
    expect(tryBeginSubmission(lock)).toBe(false);
    finishSubmission(lock);
    expect(tryBeginSubmission(lock)).toBe(true);
  });

  it("reports the history empty state after loading completes", () => {
    expect(
      getEntryListViewState({
        entryCount: 0,
        error: false,
        loading: false,
      }),
    ).toBe("empty");
  });

  it("appends pagination results without replacing existing entries", () => {
    const existing = createEntry("entry-1", "第一页记录");
    const duplicate = createEntry("entry-1", "不应覆盖");
    const next = createEntry("entry-2", "第二页记录");

    expect(appendJournalEntries([existing], [duplicate, next])).toEqual([
      existing,
      next,
    ]);
  });

  it("supports cancel and confirm transitions for deletion", () => {
    const opened = deleteDialogReducer(
      { open: false, deleting: false },
      { type: "open" },
    );
    expect(deleteDialogReducer(opened, { type: "cancel" })).toEqual({
      open: false,
      deleting: false,
    });

    expect(deleteDialogReducer(opened, { type: "confirm" })).toEqual({
      open: true,
      deleting: true,
    });
  });

  it("creates predictable default values with the current time", () => {
    const values = createDefaultJournalFormValues(new Date(2026, 5, 24, 8, 7));

    expect(values).toMatchObject({
      mood: "5",
      stress: "5",
      energy: "5",
      sleepHours: "8",
      sleepQuality: "5",
      eventTags: [],
      occurredAt: "2026-06-24T08:07",
    });
  });
});
