import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  ProductAccessRequiredError,
  ResourceNotFoundError,
  UnauthenticatedError,
} from "@/server/http/responses";
import { ensureAccount } from "@/server/repositories/account-repository";
import { recordConsent } from "@/server/services/consent-service";
import { createJournalEntry } from "@/server/services/journal-service";
import { getLongTermSummary } from "@/server/services/long-term-summary-service";
import {
  createPlan,
  createPlanAction,
  deletePlan,
  listPlans,
  updatePlan,
  updatePlanAction,
} from "@/server/services/plan-service";

const baseEntry = {
  energy: 6,
  eventTags: ["study", "sleep"],
  mood: 5,
  note: "完全虚构的长期摘要集成测试记录。",
  occurredAt: "2026-06-23T15:30:00.000Z",
  sleepHours: 7.5,
  sleepQuality: 8,
  stress: 4,
};

const basePlan = {
  checkInFrequency: "weekly",
  description: "完全虚构的手动计划。",
  linkedTags: ["study"],
  sourceType: "manual",
  startDate: "2026-06-24",
  targetDate: "2026-07-01",
  title: "虚构学习计划",
} as const;

async function grantProductAccess(userId: string): Promise<void> {
  await ensureAccount(userId);
  await recordConsent(userId, {
    adultConfirmed: true,
    aiProcessingAccepted: false,
    locale: "zh-CN",
    privacyAccepted: true,
    productBoundaryAccepted: true,
    timeZone: "Asia/Tokyo",
  });
}

function uniqueUserId(label: string): string {
  return `fictional-${label}-${Date.now()}-${randomUUID()}`;
}

describe("long-term summary and plans with Firebase emulators", () => {
  it("rejects unauthenticated and unconsented access", async () => {
    await expect(
      getLongTermSummary(null, { window: "7" }),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
    await expect(listPlans(undefined)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );

    const userId = uniqueUserId("unconsented");
    await ensureAccount(userId);

    await expect(
      getLongTermSummary(userId, { window: "7" }),
    ).rejects.toBeInstanceOf(ProductAccessRequiredError);
    await expect(createPlan(userId, basePlan)).rejects.toBeInstanceOf(
      ProductAccessRequiredError,
    );
  });

  it("summarizes only the verified user's own journal data", async () => {
    const userA = uniqueUserId("summary-a");
    const userB = uniqueUserId("summary-b");
    await grantProductAccess(userA);
    await grantProductAccess(userB);

    await createJournalEntry(userA, {
      ...baseEntry,
      mood: 4,
      stress: 6,
    });
    await createJournalEntry(userB, {
      ...baseEntry,
      mood: 10,
      stress: 10,
    });

    const summary = await getLongTermSummary(
      userA,
      { window: "7" },
      new Date("2026-06-24T12:00:00.000Z"),
    );

    expect(summary).toMatchObject({
      entryCount: 1,
      moodAverage: 4,
      stressAverage: 6,
      status: "ready",
    });
    expect(JSON.stringify(summary)).not.toContain(baseEntry.note);
  });

  it("returns insufficient_data when no records exist in the window", async () => {
    const userId = uniqueUserId("summary-empty");
    await grantProductAccess(userId);

    const summary = await getLongTermSummary(
      userId,
      { window: "30" },
      new Date("2026-06-24T12:00:00.000Z"),
    );

    expect(summary).toMatchObject({
      entryCount: 0,
      status: "insufficient_data",
      moodAverage: null,
    });
    expect(summary.missingDays).toHaveLength(30);
  });

  it("allows a user to create, update, and delete their own plan", async () => {
    const userId = uniqueUserId("plans-owner");
    await grantProductAccess(userId);

    const plan = await createPlan(userId, basePlan);

    expect(plan).toMatchObject({
      sourceType: "manual",
      status: "active",
      title: "虚构学习计划",
    });
    expect(await listPlans(userId)).toHaveLength(1);

    const paused = await updatePlan(userId, plan.id, { status: "paused" });
    expect(paused.status).toBe("paused");

    await deletePlan(userId, plan.id);
    expect(await listPlans(userId)).toHaveLength(0);
  });

  it("does not allow users to operate on another user's plans", async () => {
    const userA = uniqueUserId("plans-a");
    const userB = uniqueUserId("plans-b");
    await grantProductAccess(userA);
    await grantProductAccess(userB);
    const planB = await createPlan(userB, basePlan);

    await expect(
      updatePlan(userA, planB.id, { status: "completed" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    await expect(
      createPlanAction(userA, planB.id, { title: "越权行动项" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    await expect(deletePlan(userA, planB.id)).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });

  it("allows a user to add and complete their own action item", async () => {
    const userId = uniqueUserId("plan-actions");
    await grantProductAccess(userId);
    const plan = await createPlan(userId, basePlan);
    const action = await createPlanAction(userId, plan.id, {
      description: "完全虚构的行动项。",
      dueDate: "2026-06-25",
      title: "完成一小段学习",
    });

    expect(action).toMatchObject({
      planId: plan.id,
      status: "todo",
      title: "完成一小段学习",
    });

    const completed = await updatePlanAction(userId, plan.id, action.id, {
      status: "done",
    });

    expect(completed.status).toBe("done");
    expect(completed.completedAt).toEqual(expect.any(String));
  });
});
