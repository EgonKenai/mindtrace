import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  ProductAccessRequiredError,
  ResourceNotFoundError,
  UnauthenticatedError,
} from "@/server/http/responses";
import { getAdminFirestore } from "@/server/firebase/admin";
import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntry,
  listJournalEntries,
  updateJournalEntry,
} from "@/server/services/journal-service";
import { ensureAccount } from "@/server/repositories/account-repository";
import { recordConsent } from "@/server/services/consent-service";
import { getRecentTrends } from "@/server/services/trends-service";

const baseEntry = {
  mood: 5,
  stress: 4,
  energy: 6,
  sleepHours: 7.5,
  sleepQuality: 8,
  eventTags: ["work", "sleep"],
  note: "完全虚构的集成测试记录。",
  occurredAt: "2026-06-23T15:30:00.000Z",
};

async function grantProductAccess(userId: string): Promise<void> {
  await ensureAccount(userId);
  await recordConsent(userId, {
    adultConfirmed: true,
    aiProcessingAccepted: true,
    locale: "zh-CN",
    privacyAccepted: true,
    productBoundaryAccepted: true,
    timeZone: "Asia/Tokyo",
  });
}

function uniqueUserId(label: string): string {
  return `fictional-${label}-${Date.now()}-${randomUUID()}`;
}

async function expectNotFound(promise: Promise<unknown>): Promise<void> {
  await expect(promise).rejects.toBeInstanceOf(ResourceNotFoundError);
}

describe("journal service with Firebase emulators", () => {
  it("rejects unauthenticated and unconsented journal and trend access", async () => {
    await expect(listJournalEntries(null, {})).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
    await expect(getRecentTrends(undefined, {})).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );

    const userId = uniqueUserId("unconsented");
    await ensureAccount(userId);

    await expect(createJournalEntry(userId, baseEntry)).rejects.toBeInstanceOf(
      ProductAccessRequiredError,
    );
    await expect(getRecentTrends(userId, {})).rejects.toBeInstanceOf(
      ProductAccessRequiredError,
    );
  });

  it("allows a user to create, read, edit, and delete their own entry", async () => {
    const userId = uniqueUserId("journal-owner");
    await grantProductAccess(userId);

    const created = await createJournalEntry(userId, baseEntry);

    expect(created).toMatchObject({
      mood: 5,
      stress: 4,
      localDate: "2026-06-24",
      timeZone: "Asia/Tokyo",
      revision: 1,
    });

    const read = await getJournalEntry(userId, created.id);
    expect(read).toEqual(created);

    const updated = await updateJournalEntry(userId, created.id, {
      note: "更新后的虚构集成测试记录。",
      mood: 6,
    });

    expect(updated).toMatchObject({
      id: created.id,
      mood: 6,
      note: "更新后的虚构集成测试记录。",
      revision: 2,
      localDate: "2026-06-24",
    });

    await deleteJournalEntry(userId, created.id);
    await expectNotFound(getJournalEntry(userId, created.id));
  });

  it("allows multiple entries on the same local date and lists newest first", async () => {
    const userId = uniqueUserId("same-day");
    await grantProductAccess(userId);

    const first = await createJournalEntry(userId, {
      ...baseEntry,
      occurredAt: "2026-06-23T02:00:00.000Z",
      note: "同一天第一条虚构记录。",
    });
    const second = await createJournalEntry(userId, {
      ...baseEntry,
      occurredAt: "2026-06-23T12:00:00.000Z",
      note: "同一天第二条虚构记录。",
    });

    expect(first.localDate).toBe("2026-06-23");
    expect(second.localDate).toBe("2026-06-23");

    const listed = await listJournalEntries(userId, { limit: 10 });

    expect(listed.entries.map((entry) => entry.id)).toEqual([
      second.id,
      first.id,
    ]);
    expect(listed.nextCursor).toBeNull();
  });

  it("uses a stable pagination cursor", async () => {
    const userId = uniqueUserId("pagination");
    await grantProductAccess(userId);

    const oldest = await createJournalEntry(userId, {
      ...baseEntry,
      occurredAt: "2026-06-21T12:00:00.000Z",
    });
    const middle = await createJournalEntry(userId, {
      ...baseEntry,
      occurredAt: "2026-06-22T12:00:00.000Z",
    });
    const newest = await createJournalEntry(userId, {
      ...baseEntry,
      occurredAt: "2026-06-23T12:00:00.000Z",
    });

    const firstPage = await listJournalEntries(userId, { limit: 2 });

    expect(firstPage.entries.map((entry) => entry.id)).toEqual([
      newest.id,
      middle.id,
    ]);
    expect(firstPage.nextCursor).toEqual(expect.any(String));

    const secondPage = await listJournalEntries(userId, {
      limit: 2,
      cursor: firstPage.nextCursor ?? undefined,
    });

    expect(secondPage.entries.map((entry) => entry.id)).toEqual([oldest.id]);
    expect(secondPage.nextCursor).toBeNull();
  });

  it("rejects malformed and cross-user pagination cursors", async () => {
    const userA = uniqueUserId("cursor-user-a");
    const userB = uniqueUserId("cursor-user-b");
    await grantProductAccess(userA);
    await grantProductAccess(userB);

    for (const userId of [userA, userB]) {
      await createJournalEntry(userId, {
        ...baseEntry,
        occurredAt: "2026-06-21T12:00:00.000Z",
      });
      await createJournalEntry(userId, {
        ...baseEntry,
        occurredAt: "2026-06-22T12:00:00.000Z",
      });
    }

    const userBPage = await listJournalEntries(userB, { limit: 1 });
    expect(userBPage.nextCursor).toEqual(expect.any(String));

    await expect(
      listJournalEntries(userA, {
        limit: 10,
        cursor: userBPage.nextCursor ?? undefined,
      }),
    ).rejects.toThrow();
    await expect(
      listJournalEntries(userA, {
        limit: 10,
        cursor: "not-a-valid-cursor",
      }),
    ).rejects.toThrow();
  });

  it("does not reveal whether an entry ID belongs to another user", async () => {
    const userA = uniqueUserId("user-a");
    const userB = uniqueUserId("user-b");
    await grantProductAccess(userA);
    await grantProductAccess(userB);
    const userBEntry = await createJournalEntry(userB, baseEntry);

    await expectNotFound(getJournalEntry(userA, userBEntry.id));
    await expectNotFound(getJournalEntry(userA, "missing-entry-id"));
    await expectNotFound(
      updateJournalEntry(userA, userBEntry.id, { note: "越权虚构记录。" }),
    );
    await expectNotFound(deleteJournalEntry(userA, userBEntry.id));

    await expect(getJournalEntry(userB, userBEntry.id)).resolves.toMatchObject({
      id: userBEntry.id,
      revision: 1,
    });
  });

  it("cleans associated placeholder data when deleting an entry", async () => {
    const userId = uniqueUserId("delete-cleanup");
    await grantProductAccess(userId);
    const entry = await createJournalEntry(userId, baseEntry);
    const db = getAdminFirestore();
    const feedbackRef = db
      .collection("analyses")
      .doc(userId)
      .collection("entryFeedback")
      .doc("placeholder-feedback");
    const outcomeRef = db
      .collection("analyses")
      .doc(userId)
      .collection("suggestionOutcomes")
      .doc("placeholder-outcome");
    const safetyEventRef = db
      .collection("safetyEvents")
      .doc(userId)
      .collection("events")
      .doc("placeholder-safety-event");

    await feedbackRef.set({ entryId: entry.id, status: "pending" });
    await outcomeRef.set({ feedbackId: feedbackRef.id, status: "undecided" });
    await safetyEventRef.set({ entryId: entry.id, riskLevel: "low" });

    await deleteJournalEntry(userId, entry.id);

    await expect(feedbackRef.get()).resolves.toMatchObject({ exists: false });
    await expect(outcomeRef.get()).resolves.toMatchObject({ exists: false });
    await expect(safetyEventRef.get()).resolves.toMatchObject({
      exists: false,
    });
  });

  it("queries and aggregates all entries in the seven-day local-date window", async () => {
    const userId = uniqueUserId("trends");
    await grantProductAccess(userId);

    await createJournalEntry(userId, {
      ...baseEntry,
      mood: 4,
      sleepHours: 6.25,
      occurredAt: "2026-06-23T15:30:00.000Z",
    });
    await createJournalEntry(userId, {
      ...baseEntry,
      mood: 8,
      sleepHours: 8,
      occurredAt: "2026-06-23T20:30:00.000Z",
    });
    await createJournalEntry(userId, {
      ...baseEntry,
      mood: 9,
      occurredAt: "2026-06-21T15:30:00.000Z",
    });

    const trends = await getRecentTrends(
      userId,
      { days: "7" },
      new Date("2026-06-24T12:00:00.000Z"),
    );

    expect(trends).toMatchObject({
      days: 7,
      startDate: "2026-06-18",
      endDate: "2026-06-24",
      timeZone: "Asia/Tokyo",
      totalEntries: 3,
    });
    expect(trends.points).toHaveLength(7);
    expect(
      trends.points.find((point) => point.localDate === "2026-06-24"),
    ).toMatchObject({
      entryCount: 2,
      mood: 6,
      sleepHours: 7.13,
    });
    expect(
      trends.points.find((point) => point.localDate === "2026-06-23"),
    ).toMatchObject({
      entryCount: 0,
      mood: null,
      sleepHours: null,
    });
  });

  it("continues to group an existing entry by its saved localDate after a time-zone change", async () => {
    const userId = uniqueUserId("trend-time-zone-change");
    await grantProductAccess(userId);
    await createJournalEntry(userId, {
      ...baseEntry,
      mood: 9,
      occurredAt: "2026-06-23T15:30:00.000Z",
    });
    await getAdminFirestore().collection("accounts").doc(userId).update({
      timeZone: "America/Los_Angeles",
    });

    const trends = await getRecentTrends(
      userId,
      {},
      new Date("2026-06-25T06:00:00.000Z"),
    );

    expect(trends.timeZone).toBe("America/Los_Angeles");
    expect(trends.endDate).toBe("2026-06-24");
    expect(trends.points.at(-1)).toMatchObject({
      localDate: "2026-06-24",
      entryCount: 1,
      mood: 9,
    });
  });

  it("keeps trend results scoped to the verified user", async () => {
    const userA = uniqueUserId("trend-user-a");
    const userB = uniqueUserId("trend-user-b");
    await grantProductAccess(userA);
    await grantProductAccess(userB);
    await createJournalEntry(userA, { ...baseEntry, mood: 3 });
    await createJournalEntry(userB, { ...baseEntry, mood: 10 });

    const trends = await getRecentTrends(
      userA,
      {},
      new Date("2026-06-24T12:00:00.000Z"),
    );

    expect(trends.totalEntries).toBe(1);
    expect(
      trends.points.find((point) => point.localDate === "2026-06-24"),
    ).toMatchObject({
      entryCount: 1,
      mood: 3,
    });
  });
});
