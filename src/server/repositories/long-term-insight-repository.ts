import {
  FieldValue,
  type DocumentReference,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase-admin/firestore";

import type {
  LongTermInsightGentleSuggestion,
  LongTermInsightPattern,
  LongTermInsightSafetyLabel,
  LongTermInsightStatus,
  LongTermInsightSummarySnapshot,
  LongTermSummaryWindow,
} from "@/features/long-term/model";
import { getAdminFirestore } from "@/server/firebase/admin";

export interface LongTermInsightRecord {
  endDate: string;
  generatedAt: Timestamp;
  gentleSuggestions: LongTermInsightGentleSuggestion[];
  id: string;
  overview: string;
  patterns: LongTermInsightPattern[];
  planSuggestionRefs: string[];
  safetyLabel: LongTermInsightSafetyLabel;
  schemaVersion: 1;
  sourceSummarySnapshot: LongTermInsightSummarySnapshot;
  startDate: string;
  status: LongTermInsightStatus;
  strengths: string[];
  summaryWindow: LongTermSummaryWindow;
  title: string;
  updatedAt: Timestamp;
  watchPoints: string[];
}

export interface CreateLongTermInsightRecordInput {
  endDate: string;
  gentleSuggestions: LongTermInsightGentleSuggestion[];
  overview: string;
  patterns: LongTermInsightPattern[];
  planSuggestionRefs: string[];
  safetyLabel: LongTermInsightSafetyLabel;
  sourceSummarySnapshot: LongTermInsightSummarySnapshot;
  startDate: string;
  strengths: string[];
  summaryWindow: LongTermSummaryWindow;
  title: string;
  watchPoints: string[];
}

function insightsCollection(userId: string) {
  return getAdminFirestore()
    .collection("analyses")
    .doc(userId)
    .collection("longTermInsights");
}

function insightDocument(userId: string, insightId: string): DocumentReference {
  return insightsCollection(userId).doc(insightId);
}

function snapshotToLongTermInsightRecord(
  snapshot: DocumentSnapshot | QueryDocumentSnapshot,
): LongTermInsightRecord | null {
  if (!snapshot.exists) {
    return null;
  }

  return {
    ...(snapshot.data() as Omit<LongTermInsightRecord, "id">),
    id: snapshot.id,
  };
}

export async function createLongTermInsightRecord(
  userId: string,
  input: CreateLongTermInsightRecordInput,
): Promise<LongTermInsightRecord> {
  const insightRef = insightsCollection(userId).doc();

  await insightRef.create({
    ...input,
    generatedAt: FieldValue.serverTimestamp(),
    schemaVersion: 1,
    status: "draft",
    updatedAt: FieldValue.serverTimestamp(),
  });

  const insight = snapshotToLongTermInsightRecord(await insightRef.get());

  if (!insight) {
    throw new Error("LONG_TERM_INSIGHT_CREATE_FAILED");
  }

  return insight;
}

export async function listLongTermInsightRecords(
  userId: string,
): Promise<LongTermInsightRecord[]> {
  const snapshot = await insightsCollection(userId)
    .orderBy("generatedAt", "desc")
    .limit(20)
    .get();

  return snapshot.docs
    .map((documentSnapshot) =>
      snapshotToLongTermInsightRecord(documentSnapshot),
    )
    .filter((insight): insight is LongTermInsightRecord => insight !== null);
}

export async function getLongTermInsightRecord(
  userId: string,
  insightId: string,
): Promise<LongTermInsightRecord | null> {
  return snapshotToLongTermInsightRecord(
    await insightDocument(userId, insightId).get(),
  );
}

export async function updateLongTermInsightStatusRecord(
  userId: string,
  insightId: string,
  status: LongTermInsightStatus,
): Promise<LongTermInsightRecord | null> {
  const insightRef = insightDocument(userId, insightId);
  const snapshot = await insightRef.get();

  if (!snapshot.exists) {
    return null;
  }

  await insightRef.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return getLongTermInsightRecord(userId, insightId);
}
