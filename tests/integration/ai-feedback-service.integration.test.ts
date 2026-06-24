import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  ProductAccessRequiredError,
  ResourceNotFoundError,
  UnauthenticatedError,
} from "@/server/http/responses";
import { ensureAccount } from "@/server/repositories/account-repository";
import { generateEntryFeedback } from "@/server/services/ai-feedback-service";
import { recordConsent } from "@/server/services/consent-service";
import { createJournalEntry } from "@/server/services/journal-service";
import { FakeAiFeedbackProvider } from "../fixtures/fake-ai-feedback-provider";

const baseEntry = {
  mood: 6,
  stress: 4,
  energy: 7,
  sleepHours: 7.5,
  sleepQuality: 8,
  eventTags: ["work", "sleep"],
  note: "完全虚构的普通 AI 反馈集成测试记录。",
  occurredAt: "2026-06-24T12:00:00.000Z",
};

function uniqueUserId(label: string): string {
  return `fictional-ai-${label}-${Date.now()}-${randomUUID()}`;
}

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

describe("AI feedback service with Firebase emulators", () => {
  it("allows a user to request feedback for their own ordinary entry", async () => {
    const userId = uniqueUserId("owner");
    await grantProductAccess(userId);
    const entry = await createJournalEntry(userId, baseEntry);
    const provider = new FakeAiFeedbackProvider();

    const feedback = await generateEntryFeedback(userId, entry.id, {
      provider,
    });

    expect(provider.calls).toHaveLength(1);
    expect(feedback).toMatchObject({
      schemaVersion: "1",
      status: "generated",
      policyDecision: "allow_generation",
      reasonCodes: ["NORMAL_JOURNAL_CONTENT"],
    });
    expect(Object.keys(feedback).sort()).toEqual([
      "disclaimer",
      "policyDecision",
      "reasonCodes",
      "reflection",
      "schemaVersion",
      "status",
      "suggestions",
    ]);
  });

  it("does not reveal whether an entry belongs to another user", async () => {
    const userA = uniqueUserId("user-a");
    const userB = uniqueUserId("user-b");
    await grantProductAccess(userA);
    await grantProductAccess(userB);
    const userBEntry = await createJournalEntry(userB, baseEntry);
    const provider = new FakeAiFeedbackProvider();

    await expect(
      generateEntryFeedback(userA, userBEntry.id, { provider }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    await expect(
      generateEntryFeedback(userA, "missing-entry", { provider }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    expect(provider.calls).toHaveLength(0);
  });

  it("rejects unauthenticated and unconsented users before provider use", async () => {
    const provider = new FakeAiFeedbackProvider();

    await expect(
      generateEntryFeedback(null, "entry", { provider }),
    ).rejects.toBeInstanceOf(UnauthenticatedError);

    const userId = uniqueUserId("unconsented");
    await ensureAccount(userId);
    await expect(
      generateEntryFeedback(userId, "entry", { provider }),
    ).rejects.toBeInstanceOf(ProductAccessRequiredError);
    expect(provider.calls).toHaveLength(0);
  });

  it("never calls the provider for a crisis redirect", async () => {
    const userId = uniqueUserId("crisis");
    await grantProductAccess(userId);
    const entry = await createJournalEntry(userId, {
      ...baseEntry,
      note: "我现在要自杀。",
    });
    const provider = new FakeAiFeedbackProvider();

    const feedback = await generateEntryFeedback(userId, entry.id, {
      provider,
    });

    expect(provider.calls).toHaveLength(0);
    expect(feedback).toMatchObject({
      status: "crisis_redirect",
      policyDecision: "crisis_redirect",
      reasonCodes: ["EXPLICIT_IMMEDIATE_SELF_HARM"],
    });
  });

  it("does not expose provider errors, prompt data, or journal text", async () => {
    const userId = uniqueUserId("safe-error");
    await grantProductAccess(userId);
    const sensitiveFixture =
      "完全虚构且不应出现在响应中的日记正文 secret-journal-fixture";
    const entry = await createJournalEntry(userId, {
      ...baseEntry,
      note: sensitiveFixture,
    });
    const provider = new FakeAiFeedbackProvider({
      reflection: "你一定患有抑郁症。",
      suggestions: [],
      internalPrompt: "secret-system-prompt",
    });

    const feedback = await generateEntryFeedback(userId, entry.id, {
      provider,
    });
    const serialized = JSON.stringify(feedback);

    expect(feedback.reasonCodes).toEqual(["PROVIDER_OUTPUT_INVALID"]);
    expect(serialized).not.toContain(sensitiveFixture);
    expect(serialized).not.toContain("secret-system-prompt");
    expect(serialized).not.toContain("抑郁症");
  });
});
