import { describe, expect, it } from "vitest";

import {
  JOURNAL_EVENT_TAG_IDS,
  JOURNAL_MAX_EVENT_TAGS,
  JOURNAL_NOTE_MAX_CHARACTERS,
} from "@/server/journal/event-tags";
import {
  createJournalEntryInputSchema,
  getLocalDateForTimeZone,
  isValidTimeZone,
  updateJournalEntryInputSchema,
} from "@/server/journal/schema";

const validEntry = {
  mood: 5,
  stress: 4,
  energy: 6,
  sleepHours: 7.5,
  sleepQuality: 8,
  eventTags: ["work", "sleep"],
  note: "这是完全虚构的测试记录。",
  occurredAt: "2026-06-23T15:30:00.000Z",
} as const;

describe("journal entry schema", () => {
  it("accepts numeric lower and upper boundaries", () => {
    expect(
      createJournalEntryInputSchema.parse({
        ...validEntry,
        mood: 1,
        stress: 10,
        energy: 1,
        sleepQuality: 10,
        sleepHours: 0,
      }),
    ).toMatchObject({
      mood: 1,
      stress: 10,
      energy: 1,
      sleepQuality: 10,
      sleepHours: 0,
    });

    expect(
      createJournalEntryInputSchema.parse({
        ...validEntry,
        sleepHours: 24,
      }),
    ).toMatchObject({ sleepHours: 24 });
  });

  it("rejects numeric values outside allowed ranges", () => {
    for (const field of ["mood", "stress", "energy", "sleepQuality"]) {
      expect(() =>
        createJournalEntryInputSchema.parse({
          ...validEntry,
          [field]: 0,
        }),
      ).toThrow();
      expect(() =>
        createJournalEntryInputSchema.parse({
          ...validEntry,
          [field]: 11,
        }),
      ).toThrow();
    }
  });

  it("rejects non-integer score fields", () => {
    for (const field of ["mood", "stress", "energy", "sleepQuality"]) {
      expect(() =>
        createJournalEntryInputSchema.parse({
          ...validEntry,
          [field]: 5.5,
        }),
      ).toThrow();
    }
  });

  it("accepts fractional sleep hours and rejects sleep hour bounds", () => {
    expect(
      createJournalEntryInputSchema.parse({
        ...validEntry,
        sleepHours: 6.25,
      }),
    ).toMatchObject({ sleepHours: 6.25 });

    expect(() =>
      createJournalEntryInputSchema.parse({
        ...validEntry,
        sleepHours: -0.1,
      }),
    ).toThrow();
    expect(() =>
      createJournalEntryInputSchema.parse({
        ...validEntry,
        sleepHours: 24.1,
      }),
    ).toThrow();
  });

  it("rejects invalid, duplicate, and too many event tags", () => {
    expect(() =>
      createJournalEntryInputSchema.parse({
        ...validEntry,
        eventTags: ["work", "medical_diagnosis"],
      }),
    ).toThrow();
    expect(() =>
      createJournalEntryInputSchema.parse({
        ...validEntry,
        eventTags: ["work", "work"],
      }),
    ).toThrow();
    expect(() =>
      createJournalEntryInputSchema.parse({
        ...validEntry,
        eventTags: JOURNAL_EVENT_TAG_IDS.slice(0, JOURNAL_MAX_EVENT_TAGS + 1),
      }),
    ).toThrow();
  });

  it("accepts the event tag count limit", () => {
    expect(
      createJournalEntryInputSchema.parse({
        ...validEntry,
        eventTags: JOURNAL_EVENT_TAG_IDS.slice(0, JOURNAL_MAX_EVENT_TAGS),
      }),
    ).toMatchObject({
      eventTags: JOURNAL_EVENT_TAG_IDS.slice(0, JOURNAL_MAX_EVENT_TAGS),
    });
  });

  it("accepts 5000 Unicode characters and rejects longer notes", () => {
    const boundaryNote = "好".repeat(JOURNAL_NOTE_MAX_CHARACTERS);
    const tooLongNote = `${boundaryNote}长`;

    expect(
      createJournalEntryInputSchema.parse({
        ...validEntry,
        note: boundaryNote,
      }),
    ).toMatchObject({ note: boundaryNote });
    expect(() =>
      createJournalEntryInputSchema.parse({
        ...validEntry,
        note: tooLongNote,
      }),
    ).toThrow();
  });

  it("rejects invalid occurrence dates", () => {
    for (const occurredAt of [
      "not-a-date",
      "2026-02-31T00:00:00Z",
      "2026-06-23T15:30:00",
      "2026-06-23",
    ]) {
      expect(() =>
        createJournalEntryInputSchema.parse({
          ...validEntry,
          occurredAt,
        }),
      ).toThrow();
    }
  });

  it("validates IANA time zones and derives local dates", () => {
    expect(isValidTimeZone("Asia/Tokyo")).toBe(true);
    expect(isValidTimeZone("Tokyo local time")).toBe(false);
    expect(
      getLocalDateForTimeZone(
        new Date("2026-06-23T15:30:00.000Z"),
        "Asia/Tokyo",
      ),
    ).toBe("2026-06-24");
    expect(() =>
      getLocalDateForTimeZone(
        new Date("2026-06-23T15:30:00.000Z"),
        "Tokyo local time",
      ),
    ).toThrow();
  });

  it("rejects unknown create and update fields", () => {
    expect(() =>
      createJournalEntryInputSchema.parse({
        ...validEntry,
        ownerId: "fictional-user",
      }),
    ).toThrow();
    expect(() =>
      updateJournalEntryInputSchema.parse({
        note: "新的虚构测试记录。",
        createdAt: "2026-06-23T15:30:00.000Z",
      }),
    ).toThrow();
  });

  it("rejects empty updates", () => {
    expect(() => updateJournalEntryInputSchema.parse({})).toThrow();
  });
});
