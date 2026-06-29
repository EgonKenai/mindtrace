import {
  FieldValue,
  type DocumentReference,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase-admin/firestore";

import type { JournalEventTagId } from "@/features/journal/model";
import type { LongTermSummaryWindow } from "@/features/long-term/model";
import type {
  PlanSuggestionAction,
  PlanSuggestionSafetyLabel,
  PlanSuggestionStatus,
} from "@/features/plans/model";
import { getAdminFirestore } from "@/server/firebase/admin";

export interface PlanSuggestionRecord {
  description: string;
  endDate: string;
  generatedAt: Timestamp;
  id: string;
  linkedTags: JournalEventTagId[];
  rationale: string;
  safetyLabel: PlanSuggestionSafetyLabel;
  schemaVersion: 1;
  startDate: string;
  status: PlanSuggestionStatus;
  suggestedActions: PlanSuggestionAction[];
  summaryWindow: LongTermSummaryWindow;
  title: string;
  updatedAt: Timestamp;
}

export interface CreatePlanSuggestionRecordInput {
  description: string;
  endDate: string;
  linkedTags: JournalEventTagId[];
  rationale: string;
  safetyLabel: PlanSuggestionSafetyLabel;
  startDate: string;
  suggestedActions: PlanSuggestionAction[];
  summaryWindow: LongTermSummaryWindow;
  title: string;
}

function suggestionsCollection(userId: string) {
  return getAdminFirestore()
    .collection("analyses")
    .doc(userId)
    .collection("planSuggestions");
}

function suggestionDocument(
  userId: string,
  suggestionId: string,
): DocumentReference {
  return suggestionsCollection(userId).doc(suggestionId);
}

function snapshotToPlanSuggestionRecord(
  snapshot: DocumentSnapshot | QueryDocumentSnapshot,
): PlanSuggestionRecord | null {
  if (!snapshot.exists) {
    return null;
  }

  return {
    ...(snapshot.data() as Omit<PlanSuggestionRecord, "id">),
    id: snapshot.id,
  };
}

export async function createPlanSuggestionRecord(
  userId: string,
  input: CreatePlanSuggestionRecordInput,
): Promise<PlanSuggestionRecord> {
  const suggestionRef = suggestionsCollection(userId).doc();

  await suggestionRef.create({
    ...input,
    generatedAt: FieldValue.serverTimestamp(),
    schemaVersion: 1,
    status: "draft",
    updatedAt: FieldValue.serverTimestamp(),
  });

  const suggestion = snapshotToPlanSuggestionRecord(await suggestionRef.get());

  if (!suggestion) {
    throw new Error("PLAN_SUGGESTION_CREATE_FAILED");
  }

  return suggestion;
}

export async function listPlanSuggestionRecords(
  userId: string,
): Promise<PlanSuggestionRecord[]> {
  const snapshot = await suggestionsCollection(userId)
    .orderBy("generatedAt", "desc")
    .limit(20)
    .get();

  return snapshot.docs
    .map((documentSnapshot) => snapshotToPlanSuggestionRecord(documentSnapshot))
    .filter(
      (suggestion): suggestion is PlanSuggestionRecord => suggestion !== null,
    );
}

export async function getPlanSuggestionRecord(
  userId: string,
  suggestionId: string,
): Promise<PlanSuggestionRecord | null> {
  return snapshotToPlanSuggestionRecord(
    await suggestionDocument(userId, suggestionId).get(),
  );
}

export async function updatePlanSuggestionStatusRecord(
  userId: string,
  suggestionId: string,
  status: PlanSuggestionStatus,
): Promise<PlanSuggestionRecord | null> {
  const suggestionRef = suggestionDocument(userId, suggestionId);
  const snapshot = await suggestionRef.get();

  if (!snapshot.exists) {
    return null;
  }

  await suggestionRef.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return getPlanSuggestionRecord(userId, suggestionId);
}
