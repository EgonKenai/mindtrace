import { Timestamp } from "firebase-admin/firestore";

import type { JournalEntry, JournalEntryList } from "@/features/journal/model";
import { getAccessState } from "@/server/auth/access";
import {
  createJournalEntryInputSchema,
  getLocalDateForTimeZone,
  isValidTimeZone,
  listJournalEntriesQuerySchema,
  parseOccurredAt,
  updateJournalEntryInputSchema,
} from "@/server/journal/schema";
import {
  InvalidRequestError,
  ProductAccessRequiredError,
  ResourceNotFoundError,
  UnauthenticatedError,
} from "@/server/http/responses";
import {
  createJournalEntryRecord,
  deleteJournalEntryRecord,
  getJournalEntryRecord,
  listJournalEntryRecords,
  updateJournalEntryRecord,
  type JournalEntryRecord,
  type UpdateJournalEntryRecordInput,
} from "@/server/repositories/journal-repository";

interface JournalAccessContext {
  timeZone: string;
  userId: string;
}

async function requireJournalAccess(
  userId: string | null | undefined,
): Promise<JournalAccessContext> {
  if (!userId) {
    throw new UnauthenticatedError();
  }

  const access = await getAccessState(userId);

  if (!access.hasProductAccess || !access.account) {
    throw new ProductAccessRequiredError();
  }

  if (!isValidTimeZone(access.account.timeZone)) {
    throw new InvalidRequestError();
  }

  return {
    timeZone: access.account.timeZone,
    userId,
  };
}

function serializeJournalEntry(entry: JournalEntryRecord): JournalEntry {
  return {
    id: entry.id,
    mood: entry.mood,
    stress: entry.stress,
    energy: entry.energy,
    sleepHours: entry.sleepHours,
    sleepQuality: entry.sleepQuality,
    eventTags: entry.eventTags,
    note: entry.note,
    occurredAt: entry.occurredAt.toDate().toISOString(),
    localDate: entry.localDate,
    timeZone: entry.timeZone,
    createdAt: entry.createdAt.toDate().toISOString(),
    updatedAt: entry.updatedAt.toDate().toISOString(),
    revision: entry.revision,
  };
}

export async function createJournalEntry(
  userId: string | null | undefined,
  input: unknown,
): Promise<JournalEntry> {
  const context = await requireJournalAccess(userId);
  const parsed = createJournalEntryInputSchema.parse(input);
  const occurredAt = parseOccurredAt(parsed.occurredAt);
  const localDate = getLocalDateForTimeZone(occurredAt, context.timeZone);
  const entry = await createJournalEntryRecord(context.userId, {
    ...parsed,
    occurredAt: Timestamp.fromDate(occurredAt),
    localDate,
    timeZone: context.timeZone,
  });

  return serializeJournalEntry(entry);
}

export async function listJournalEntries(
  userId: string | null | undefined,
  query: unknown,
): Promise<JournalEntryList> {
  const context = await requireJournalAccess(userId);
  const parsed = listJournalEntriesQuerySchema.parse(query);
  const result = await listJournalEntryRecords(context.userId, parsed);

  return {
    entries: result.entries.map((entry) => serializeJournalEntry(entry)),
    nextCursor: result.nextCursor,
  };
}

export async function getJournalEntry(
  userId: string | null | undefined,
  entryId: string,
): Promise<JournalEntry> {
  const context = await requireJournalAccess(userId);
  const entry = await getJournalEntryRecord(context.userId, entryId);

  if (!entry) {
    throw new ResourceNotFoundError();
  }

  return serializeJournalEntry(entry);
}

export async function updateJournalEntry(
  userId: string | null | undefined,
  entryId: string,
  input: unknown,
): Promise<JournalEntry> {
  const context = await requireJournalAccess(userId);
  const parsed = updateJournalEntryInputSchema.parse(input);
  const { occurredAt: occurredAtInput, ...mutableFields } = parsed;
  const update: UpdateJournalEntryRecordInput = {
    ...mutableFields,
  };

  if (occurredAtInput) {
    const occurredAt = parseOccurredAt(occurredAtInput);
    update.occurredAt = Timestamp.fromDate(occurredAt);
    update.localDate = getLocalDateForTimeZone(occurredAt, context.timeZone);
    update.timeZone = context.timeZone;
  }

  const entry = await updateJournalEntryRecord(context.userId, entryId, update);

  if (!entry) {
    throw new ResourceNotFoundError();
  }

  return serializeJournalEntry(entry);
}

export async function deleteJournalEntry(
  userId: string | null | undefined,
  entryId: string,
): Promise<void> {
  const context = await requireJournalAccess(userId);
  const deleted = await deleteJournalEntryRecord(context.userId, entryId);

  if (!deleted) {
    throw new ResourceNotFoundError();
  }
}
