import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  AiProcessingConsentRequiredError,
  ProductAccessRequiredError,
  ResourceNotFoundError,
  UnauthenticatedError,
} from "@/server/http/responses";
import { ensureAccount } from "@/server/repositories/account-repository";
import { recordConsent } from "@/server/services/consent-service";
import { createJournalEntry } from "@/server/services/journal-service";
import { getLongTermSummary } from "@/server/services/long-term-summary-service";
import {
  acceptPlanSuggestion,
  dismissPlanSuggestion,
  generatePlanSuggestion,
  listPlanSuggestions,
} from "@/server/services/plan-suggestion-service";
import {
  createPlan,
  createPlanAction,
  deletePlan,
  listPlans,
  updatePlan,
  updatePlanAction,
} from "@/server/services/plan-service";
import { FakeAiPlanSuggestionProvider } from "../fixtures/fake-ai-plan-suggestion-provider";

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

async function grantProductAccess(
  userId: string,
  aiProcessingAccepted = false,
): Promise<void> {
  await ensureAccount(userId);
  await recordConsent(userId, {
    adultConfirmed: true,
    aiProcessingAccepted,
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

  it("generates an AI plan suggestion draft with consent and minimized provider input", async () => {
    const userId = uniqueUserId("plan-suggestion");
    await grantProductAccess(userId, true);
    await createJournalEntry(userId, baseEntry);

    const provider = new FakeAiPlanSuggestionProvider();
    const result = await generatePlanSuggestion(
      userId,
      { summaryWindow: 7 },
      { provider },
    );

    expect(result).toMatchObject({
      status: "generated",
      reasonCodes: ["NORMAL_SUMMARY_CONTENT"],
    });
    expect(result.suggestion?.status).toBe("draft");
    expect(provider.calls).toHaveLength(1);
    expect(JSON.stringify(provider.calls[0])).not.toContain(baseEntry.note);
    expect(JSON.stringify(provider.calls[0])).not.toMatch(
      /uid|email|Cookie|token/i,
    );
  });

  it("does not call the provider without AI consent or sufficient data", async () => {
    const noAiConsentUser = uniqueUserId("plan-suggestion-no-ai");
    await grantProductAccess(noAiConsentUser, false);
    await createJournalEntry(noAiConsentUser, baseEntry);
    const consentProvider = new FakeAiPlanSuggestionProvider();

    await expect(
      generatePlanSuggestion(
        noAiConsentUser,
        { summaryWindow: 7 },
        { provider: consentProvider },
      ),
    ).rejects.toBeInstanceOf(AiProcessingConsentRequiredError);
    expect(consentProvider.calls).toHaveLength(0);

    const emptyUser = uniqueUserId("plan-suggestion-empty");
    await grantProductAccess(emptyUser, true);
    const emptyProvider = new FakeAiPlanSuggestionProvider();

    await expect(
      generatePlanSuggestion(
        emptyUser,
        { summaryWindow: 7 },
        { provider: emptyProvider },
      ),
    ).resolves.toMatchObject({ status: "insufficient_data" });
    expect(emptyProvider.calls).toHaveLength(0);
  });

  it("keeps suggestion drafts scoped to their owner", async () => {
    const userA = uniqueUserId("plan-suggestion-a");
    const userB = uniqueUserId("plan-suggestion-b");
    await grantProductAccess(userA, true);
    await grantProductAccess(userB, true);
    await createJournalEntry(userB, baseEntry);

    const resultB = await generatePlanSuggestion(
      userB,
      { summaryWindow: 7 },
      { provider: new FakeAiPlanSuggestionProvider() },
    );

    expect(await listPlanSuggestions(userA)).toHaveLength(0);
    await expect(
      acceptPlanSuggestion(userA, resultB.suggestion?.id ?? "missing"),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("accepts a draft into a formal plan and prevents later acceptance", async () => {
    const userId = uniqueUserId("plan-suggestion-accept");
    await grantProductAccess(userId, true);
    await createJournalEntry(userId, baseEntry);

    const generated = await generatePlanSuggestion(
      userId,
      { summaryWindow: 7 },
      { provider: new FakeAiPlanSuggestionProvider() },
    );
    const suggestionId = generated.suggestion?.id;
    expect(suggestionId).toEqual(expect.any(String));

    const accepted = await acceptPlanSuggestion(userId, suggestionId ?? "");
    expect(accepted.plan).toMatchObject({
      sourceType: "ai_suggested",
      title: generated.suggestion?.title,
    });
    expect(accepted.plan.actions).toHaveLength(1);

    await expect(
      acceptPlanSuggestion(userId, suggestionId ?? ""),
    ).rejects.toThrow("INVALID_REQUEST");
  });

  it("dismisses a draft and does not allow later acceptance", async () => {
    const userId = uniqueUserId("plan-suggestion-dismiss");
    await grantProductAccess(userId, true);
    await createJournalEntry(userId, baseEntry);
    const generated = await generatePlanSuggestion(
      userId,
      { summaryWindow: 7 },
      { provider: new FakeAiPlanSuggestionProvider() },
    );

    const dismissed = await dismissPlanSuggestion(
      userId,
      generated.suggestion?.id ?? "",
    );

    expect(dismissed.status).toBe("dismissed");
    await expect(
      acceptPlanSuggestion(userId, generated.suggestion?.id ?? ""),
    ).rejects.toThrow("INVALID_REQUEST");
  });

  it("uses safe fallback for malformed provider output without exposing internals", async () => {
    const userId = uniqueUserId("plan-suggestion-provider-error");
    await grantProductAccess(userId, true);
    await createJournalEntry(userId, baseEntry);

    const result = await generatePlanSuggestion(
      userId,
      { summaryWindow: 7 },
      { provider: new FakeAiPlanSuggestionProvider("secret raw output") },
    );

    expect(result).toMatchObject({
      reasonCodes: ["PROVIDER_OUTPUT_INVALID"],
      status: "safe_fallback",
      suggestion: null,
    });
    expect(JSON.stringify(result)).not.toContain("secret raw output");
  });
});
