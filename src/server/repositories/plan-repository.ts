import {
  FieldValue,
  type DocumentReference,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase-admin/firestore";

import type { JournalEventTagId } from "@/features/journal/model";
import type {
  PlanActionStatus,
  PlanCheckInFrequency,
  PlanSourceType,
  PlanStatus,
} from "@/features/plans/model";
import { getAdminFirestore } from "@/server/firebase/admin";

export interface PlanRecord {
  checkInFrequency: PlanCheckInFrequency;
  createdAt: Timestamp;
  description: string;
  id: string;
  linkedTags: JournalEventTagId[];
  schemaVersion: 1;
  sourceType: PlanSourceType;
  startDate: string;
  status: PlanStatus;
  targetDate: string | null;
  title: string;
  updatedAt: Timestamp;
}

export interface PlanActionRecord {
  completedAt: Timestamp | null;
  createdAt: Timestamp;
  description: string;
  dueDate: string | null;
  id: string;
  planId: string;
  schemaVersion: 1;
  status: PlanActionStatus;
  title: string;
  updatedAt: Timestamp;
}

export interface CreatePlanRecordInput {
  checkInFrequency: PlanCheckInFrequency;
  description: string;
  linkedTags: JournalEventTagId[];
  sourceType: "manual";
  startDate: string;
  targetDate: string | null;
  title: string;
}

export interface UpdatePlanRecordInput {
  checkInFrequency?: PlanCheckInFrequency;
  description?: string;
  linkedTags?: JournalEventTagId[];
  startDate?: string;
  status?: PlanStatus;
  targetDate?: string | null;
  title?: string;
}

export interface CreatePlanActionRecordInput {
  description: string;
  dueDate: string | null;
  title: string;
}

export interface UpdatePlanActionRecordInput {
  description?: string;
  dueDate?: string | null;
  status?: PlanActionStatus;
  title?: string;
}

function plansCollection(userId: string) {
  return getAdminFirestore()
    .collection("plans")
    .doc(userId)
    .collection("items");
}

function planDocument(userId: string, planId: string): DocumentReference {
  return plansCollection(userId).doc(planId);
}

function actionsCollection(userId: string, planId: string) {
  return planDocument(userId, planId).collection("actions");
}

function actionDocument(
  userId: string,
  planId: string,
  actionId: string,
): DocumentReference {
  return actionsCollection(userId, planId).doc(actionId);
}

function snapshotToPlanRecord(
  snapshot: DocumentSnapshot | QueryDocumentSnapshot,
): PlanRecord | null {
  if (!snapshot.exists) {
    return null;
  }

  return {
    ...(snapshot.data() as Omit<PlanRecord, "id">),
    id: snapshot.id,
  };
}

function snapshotToActionRecord(
  planId: string,
  snapshot: DocumentSnapshot | QueryDocumentSnapshot,
): PlanActionRecord | null {
  if (!snapshot.exists) {
    return null;
  }

  return {
    ...(snapshot.data() as Omit<PlanActionRecord, "id" | "planId">),
    id: snapshot.id,
    planId,
  };
}

export async function createPlanRecord(
  userId: string,
  input: CreatePlanRecordInput,
): Promise<PlanRecord> {
  const planRef = plansCollection(userId).doc();

  await planRef.create({
    ...input,
    createdAt: FieldValue.serverTimestamp(),
    schemaVersion: 1,
    status: "active",
    updatedAt: FieldValue.serverTimestamp(),
  });

  const plan = snapshotToPlanRecord(await planRef.get());

  if (!plan) {
    throw new Error("PLAN_CREATE_FAILED");
  }

  return plan;
}

export async function listPlanRecords(userId: string): Promise<PlanRecord[]> {
  const snapshot = await plansCollection(userId)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  return snapshot.docs
    .map((documentSnapshot) => snapshotToPlanRecord(documentSnapshot))
    .filter((plan): plan is PlanRecord => plan !== null);
}

export async function getPlanRecord(
  userId: string,
  planId: string,
): Promise<PlanRecord | null> {
  return snapshotToPlanRecord(await planDocument(userId, planId).get());
}

export async function updatePlanRecord(
  userId: string,
  planId: string,
  input: UpdatePlanRecordInput,
): Promise<PlanRecord | null> {
  const planRef = planDocument(userId, planId);
  const snapshot = await planRef.get();

  if (!snapshot.exists) {
    return null;
  }

  await planRef.update({
    ...input,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return getPlanRecord(userId, planId);
}

export async function deletePlanRecord(
  userId: string,
  planId: string,
): Promise<boolean> {
  const planRef = planDocument(userId, planId);
  const snapshot = await planRef.get();

  if (!snapshot.exists) {
    return false;
  }

  const actionSnapshot = await actionsCollection(userId, planId).get();
  const db = getAdminFirestore();
  const refs = [
    planRef,
    ...actionSnapshot.docs.map((document) => document.ref),
  ];

  for (let index = 0; index < refs.length; index += 450) {
    const batch = db.batch();

    for (const ref of refs.slice(index, index + 450)) {
      batch.delete(ref);
    }

    await batch.commit();
  }

  return true;
}

export async function createPlanActionRecord(
  userId: string,
  planId: string,
  input: CreatePlanActionRecordInput,
): Promise<PlanActionRecord | null> {
  if (!(await getPlanRecord(userId, planId))) {
    return null;
  }

  const actionRef = actionsCollection(userId, planId).doc();

  await actionRef.create({
    ...input,
    completedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    schemaVersion: 1,
    status: "todo",
    updatedAt: FieldValue.serverTimestamp(),
  });

  return snapshotToActionRecord(planId, await actionRef.get());
}

export async function listPlanActionRecords(
  userId: string,
  planId: string,
): Promise<PlanActionRecord[]> {
  const snapshot = await actionsCollection(userId, planId)
    .orderBy("createdAt", "asc")
    .limit(100)
    .get();

  return snapshot.docs
    .map((documentSnapshot) => snapshotToActionRecord(planId, documentSnapshot))
    .filter((action): action is PlanActionRecord => action !== null);
}

export async function updatePlanActionRecord(
  userId: string,
  planId: string,
  actionId: string,
  input: UpdatePlanActionRecordInput,
): Promise<PlanActionRecord | null> {
  const actionRef = actionDocument(userId, planId, actionId);
  const db = getAdminFirestore();
  const updated = await db.runTransaction(async (transaction) => {
    const [planSnapshot, actionSnapshot] = await Promise.all([
      transaction.get(planDocument(userId, planId)),
      transaction.get(actionRef),
    ]);

    if (!planSnapshot.exists || !actionSnapshot.exists) {
      return false;
    }

    transaction.update(actionRef, {
      ...input,
      ...(input.status === "done"
        ? { completedAt: FieldValue.serverTimestamp() }
        : {}),
      ...(input.status && input.status !== "done" ? { completedAt: null } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });

  if (!updated) {
    return null;
  }

  return snapshotToActionRecord(planId, await actionRef.get());
}
