import { createHash } from "node:crypto";

import {
  FieldPath,
  FieldValue,
  Timestamp,
  type DocumentReference,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { z } from "zod";

import type { JournalEventTagId } from "@/server/journal/event-tags";
import { getAdminFirestore } from "@/server/firebase/admin";

export interface JournalEntryRecord {
  createdAt: Timestamp;
  energy: number;
  eventTags: JournalEventTagId[];
  id: string;
  localDate: string;
  mood: number;
  note: string;
  occurredAt: Timestamp;
  revision: number;
  sleepHours: number;
  sleepQuality: number;
  stress: number;
  timeZone: string;
  updatedAt: Timestamp;
}

export type JournalTrendRecord = Pick<
  JournalEntryRecord,
  "energy" | "localDate" | "mood" | "sleepHours" | "sleepQuality" | "stress"
>;

export interface CreateJournalEntryRecordInput {
  energy: number;
  eventTags: JournalEventTagId[];
  localDate: string;
  mood: number;
  note: string;
  occurredAt: Timestamp;
  sleepHours: number;
  sleepQuality: number;
  stress: number;
  timeZone: string;
}

export interface UpdateJournalEntryRecordInput {
  energy?: number;
  eventTags?: JournalEventTagId[];
  localDate?: string;
  mood?: number;
  note?: string;
  occurredAt?: Timestamp;
  sleepHours?: number;
  sleepQuality?: number;
  stress?: number;
  timeZone?: string;
}

export interface ListJournalEntriesInput {
  cursor?: string;
  limit: number;
}

export interface ListJournalEntriesResult {
  entries: JournalEntryRecord[];
  nextCursor: string | null;
}

interface DecodedJournalEntriesCursor {
  createdAt: Timestamp;
  entryId: string;
  occurredAt: Timestamp;
}

const timestampCursorSchema = z
  .object({
    nanoseconds: z.number().int().min(0).max(999_999_999),
    seconds: z.number().int(),
  })
  .strict();

const journalEntriesCursorSchema = z
  .object({
    createdAt: timestampCursorSchema,
    entryId: z.string().min(1).max(128),
    occurredAt: timestampCursorSchema,
    ownerScope: z.string().length(32),
    version: z.literal(2),
  })
  .strict();

function entriesCollection(userId: string) {
  return getAdminFirestore()
    .collection("journals")
    .doc(userId)
    .collection("entries");
}

function entryDocument(userId: string, entryId: string): DocumentReference {
  return entriesCollection(userId).doc(entryId);
}

function snapshotToEntryRecord(
  snapshot: DocumentSnapshot | QueryDocumentSnapshot,
): JournalEntryRecord | null {
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as Omit<JournalEntryRecord, "id">;

  return {
    ...data,
    id: snapshot.id,
  };
}

function encodeTimestamp(timestamp: Timestamp): {
  nanoseconds: number;
  seconds: number;
} {
  return {
    nanoseconds: timestamp.nanoseconds,
    seconds: timestamp.seconds,
  };
}

function getCursorOwnerScope(userId: string): string {
  return createHash("sha256").update(userId).digest("hex").slice(0, 32);
}

function encodeCursor(userId: string, entry: JournalEntryRecord): string {
  return Buffer.from(
    JSON.stringify({
      version: 2,
      entryId: entry.id,
      occurredAt: encodeTimestamp(entry.occurredAt),
      createdAt: encodeTimestamp(entry.createdAt),
      ownerScope: getCursorOwnerScope(userId),
    }),
  ).toString("base64url");
}

function decodeCursor(
  userId: string,
  cursor: string,
): DecodedJournalEntriesCursor {
  const decoded = journalEntriesCursorSchema.parse(
    JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")),
  );

  z.literal(getCursorOwnerScope(userId)).parse(decoded.ownerScope);

  return {
    entryId: decoded.entryId,
    occurredAt: new Timestamp(
      decoded.occurredAt.seconds,
      decoded.occurredAt.nanoseconds,
    ),
    createdAt: new Timestamp(
      decoded.createdAt.seconds,
      decoded.createdAt.nanoseconds,
    ),
  };
}

export async function createJournalEntryRecord(
  userId: string,
  input: CreateJournalEntryRecordInput,
): Promise<JournalEntryRecord> {
  const entryRef = entriesCollection(userId).doc();

  await entryRef.create({
    ...input,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    revision: 1,
  });

  const snapshot = await entryRef.get();
  const entry = snapshotToEntryRecord(snapshot);

  if (!entry) {
    throw new Error("JOURNAL_ENTRY_CREATE_FAILED");
  }

  return entry;
}

export async function listJournalEntryRecords(
  userId: string,
  input: ListJournalEntriesInput,
): Promise<ListJournalEntriesResult> {
  const cursor = input.cursor ? decodeCursor(userId, input.cursor) : null;
  let query = entriesCollection(userId)
    .orderBy("occurredAt", "desc")
    .orderBy("createdAt", "desc")
    .orderBy(FieldPath.documentId(), "desc")
    .limit(input.limit + 1);

  if (cursor) {
    query = query.startAfter(
      cursor.occurredAt,
      cursor.createdAt,
      cursor.entryId,
    );
  }

  const snapshot = await query.get();
  const records = snapshot.docs
    .slice(0, input.limit)
    .map((documentSnapshot) => snapshotToEntryRecord(documentSnapshot))
    .filter((entry): entry is JournalEntryRecord => entry !== null);
  const hasNextPage = snapshot.docs.length > input.limit;

  return {
    entries: records,
    nextCursor: hasNextPage
      ? encodeCursor(userId, records[records.length - 1])
      : null,
  };
}

export async function listJournalTrendRecords(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<JournalTrendRecord[]> {
  const snapshot = await entriesCollection(userId)
    .where("localDate", ">=", startDate)
    .where("localDate", "<=", endDate)
    .orderBy("localDate", "asc")
    .select(
      "localDate",
      "mood",
      "stress",
      "energy",
      "sleepHours",
      "sleepQuality",
    )
    .get();

  return snapshot.docs.map(
    (documentSnapshot) => documentSnapshot.data() as JournalTrendRecord,
  );
}

export async function getJournalEntryRecord(
  userId: string,
  entryId: string,
): Promise<JournalEntryRecord | null> {
  const snapshot = await entryDocument(userId, entryId).get();
  return snapshotToEntryRecord(snapshot);
}

export async function updateJournalEntryRecord(
  userId: string,
  entryId: string,
  input: UpdateJournalEntryRecordInput,
): Promise<JournalEntryRecord | null> {
  const db = getAdminFirestore();
  const entryRef = entryDocument(userId, entryId);
  const updated = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(entryRef);
    const existingEntry = snapshotToEntryRecord(snapshot);

    if (!existingEntry) {
      return false;
    }

    transaction.update(entryRef, {
      ...input,
      revision: existingEntry.revision + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });

  if (!updated) {
    return null;
  }

  return getJournalEntryRecord(userId, entryId);
}

async function getAssociatedJournalDataRefs(
  userId: string,
  entryId: string,
): Promise<DocumentReference[]> {
  const db = getAdminFirestore();
  const feedbackSnapshot = await db
    .collection("analyses")
    .doc(userId)
    .collection("entryFeedback")
    .where("entryId", "==", entryId)
    .get();
  const safetyEventsSnapshot = await db
    .collection("safetyEvents")
    .doc(userId)
    .collection("events")
    .where("entryId", "==", entryId)
    .get();
  const outcomeSnapshots = await Promise.all(
    feedbackSnapshot.docs.map((feedbackDocument) =>
      db
        .collection("analyses")
        .doc(userId)
        .collection("suggestionOutcomes")
        .where("feedbackId", "==", feedbackDocument.id)
        .get(),
    ),
  );

  return [
    ...feedbackSnapshot.docs.map((snapshot) => snapshot.ref),
    ...safetyEventsSnapshot.docs.map((snapshot) => snapshot.ref),
    ...outcomeSnapshots.flatMap((snapshot) =>
      snapshot.docs.map((documentSnapshot) => documentSnapshot.ref),
    ),
  ];
}

export async function deleteJournalEntryRecord(
  userId: string,
  entryId: string,
): Promise<boolean> {
  const entryRef = entryDocument(userId, entryId);
  const snapshot = await entryRef.get();

  if (!snapshot.exists) {
    return false;
  }

  const db = getAdminFirestore();
  const associatedRefs = await getAssociatedJournalDataRefs(userId, entryId);
  const refsToDelete = [entryRef, ...associatedRefs];

  for (let index = 0; index < refsToDelete.length; index += 450) {
    const batch = db.batch();

    for (const ref of refsToDelete.slice(index, index + 450)) {
      batch.delete(ref);
    }

    await batch.commit();
  }

  return true;
}
