import { z } from "zod";

import {
  JOURNAL_EVENT_TAG_IDS,
  JOURNAL_MAX_EVENT_TAGS,
  JOURNAL_NOTE_MAX_CHARACTERS,
} from "@/features/journal/model";

const scoreSchema = z.number().int().min(1).max(10);

const eventTagsSchema = z
  .array(z.enum(JOURNAL_EVENT_TAG_IDS))
  .min(1)
  .max(JOURNAL_MAX_EVENT_TAGS)
  .refine((tags) => new Set(tags).size === tags.length);

const noteSchema = z
  .string()
  .refine((value) => Array.from(value).length <= JOURNAL_NOTE_MAX_CHARACTERS);

const isoDateTimeWithOffsetPattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/;

function isValidCalendarDateTime(value: string): boolean {
  const match = isoDateTimeWithOffsetPattern.exec(value);

  if (!match) {
    return false;
  }

  const [, year, month, day, hour, minute, second, millisecond = "0"] = match;
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  const numericHour = Number(hour);
  const numericMinute = Number(minute);
  const numericSecond = Number(second);
  const numericMillisecond = Number(millisecond.padEnd(3, "0"));

  const utcTime = Date.UTC(
    numericYear,
    numericMonth - 1,
    numericDay,
    numericHour,
    numericMinute,
    numericSecond,
    numericMillisecond,
  );
  const utcDate = new Date(utcTime);

  return (
    utcDate.getUTCFullYear() === numericYear &&
    utcDate.getUTCMonth() === numericMonth - 1 &&
    utcDate.getUTCDate() === numericDay &&
    utcDate.getUTCHours() === numericHour &&
    utcDate.getUTCMinutes() === numericMinute &&
    utcDate.getUTCSeconds() === numericSecond &&
    utcDate.getUTCMilliseconds() === numericMillisecond &&
    !Number.isNaN(Date.parse(value))
  );
}

const occurredAtSchema = z
  .string()
  .min(1)
  .max(64)
  .refine(isValidCalendarDateTime);

export const createJournalEntryInputSchema = z
  .object({
    mood: scoreSchema,
    stress: scoreSchema,
    energy: scoreSchema,
    sleepHours: z.number().min(0).max(24),
    sleepQuality: scoreSchema,
    eventTags: eventTagsSchema,
    note: noteSchema,
    occurredAt: occurredAtSchema,
  })
  .strict();

export const updateJournalEntryInputSchema = createJournalEntryInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0);

export const listJournalEntriesQuerySchema = z
  .object({
    cursor: z.string().min(1).max(2048).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export type CreateJournalEntryInput = z.infer<
  typeof createJournalEntryInputSchema
>;
export type UpdateJournalEntryInput = z.infer<
  typeof updateJournalEntryInputSchema
>;
export type ListJournalEntriesQuery = z.infer<
  typeof listJournalEntriesQuerySchema
>;

export function parseOccurredAt(value: string): Date {
  return new Date(value);
}

export function isValidTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function getLocalDateForTimeZone(date: Date, timeZone: string): string {
  if (!isValidTimeZone(timeZone)) {
    throw new Error("INVALID_TIME_ZONE");
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}
