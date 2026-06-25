import { Timestamp } from "firebase-admin/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { zhCN } from "@/i18n/messages/zh-CN";
import {
  AiFeedbackProviderError,
  type AiFeedbackProvider,
} from "@/server/ai/provider";
import { AiProcessingConsentRequiredError } from "@/server/http/responses";
import type { JournalEntryRecord } from "@/server/repositories/journal-repository";
import { generateEntryFeedback } from "@/server/services/ai-feedback-service";
import { FakeAiFeedbackProvider } from "../fixtures/fake-ai-feedback-provider";

const {
  getJournalEntryRecordMock,
  requireAiProcessingConsentMock,
  requireProductDataAccessMock,
} = vi.hoisted(() => ({
  getJournalEntryRecordMock: vi.fn(),
  requireAiProcessingConsentMock: vi.fn(),
  requireProductDataAccessMock: vi.fn(),
}));

vi.mock("@/server/repositories/journal-repository", () => ({
  getJournalEntryRecord: getJournalEntryRecordMock,
}));

vi.mock("@/server/services/product-access-service", () => ({
  requireAiProcessingConsent: requireAiProcessingConsentMock,
  requireProductDataAccess: requireProductDataAccessMock,
}));

function createEntry(
  note = "今天工作较多，但晚饭后轻松了一些。",
): JournalEntryRecord {
  const timestamp = Timestamp.fromDate(new Date("2026-06-24T12:00:00.000Z"));

  return {
    id: "entry-1",
    mood: 6,
    stress: 5,
    energy: 6,
    sleepHours: 7,
    sleepQuality: 7,
    eventTags: ["work"],
    note,
    occurredAt: timestamp,
    localDate: "2026-06-24",
    timeZone: "Asia/Tokyo",
    createdAt: timestamp,
    updatedAt: timestamp,
    revision: 1,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAiProcessingConsentMock.mockResolvedValue(undefined);
  requireProductDataAccessMock.mockResolvedValue({
    userId: "fictional-user",
    timeZone: "Asia/Tokyo",
  });
  getJournalEntryRecordMock.mockResolvedValue(createEntry());
});

describe("AI feedback service orchestration", () => {
  it("calls a fake provider once for ordinary journal content", async () => {
    const provider = new FakeAiFeedbackProvider();
    const result = await generateEntryFeedback("fictional-user", "entry-1", {
      provider,
    });

    expect(provider.calls).toHaveLength(1);
    expect(requireAiProcessingConsentMock).toHaveBeenCalledWith(
      "fictional-user",
    );
    expect(result).toMatchObject({
      status: "generated",
      policyDecision: "allow_generation",
      reasonCodes: ["NORMAL_JOURNAL_CONTENT"],
    });
  });

  it.each([
    ["我现在要自杀。", "crisis_redirect"],
    ["我真的快要撑不住了。", "supportive_redirect"],
  ])("never calls the provider for a redirect", async (note, status) => {
    getJournalEntryRecordMock.mockResolvedValue(createEntry(note));
    const provider = new FakeAiFeedbackProvider();
    const result = await generateEntryFeedback("fictional-user", "entry-1", {
      provider,
    });

    expect(provider.calls).toHaveLength(0);
    expect(requireAiProcessingConsentMock).not.toHaveBeenCalled();
    expect(result.status).toBe(status);
  });

  it("uses locale crisis copy rather than provider content", async () => {
    getJournalEntryRecordMock.mockResolvedValue(createEntry("我现在要自杀。"));
    const provider = new FakeAiFeedbackProvider({
      reflection: "不应出现的 Provider 文本",
      suggestions: [],
    });

    const result = await generateEntryFeedback("fictional-user", "entry-1", {
      provider,
    });

    expect(provider.calls).toHaveLength(0);
    expect(result.reflection).toBe(zhCN.aiFeedback.crisis.reflection);
    expect(result.suggestions).toEqual(zhCN.aiFeedback.crisis.suggestions);
  });

  it("maps provider timeout to a fixed fallback", async () => {
    const provider: AiFeedbackProvider = {
      providerType: "slow-fake",
      generateFeedback: () => new Promise(() => {}),
    };

    const result = await generateEntryFeedback("fictional-user", "entry-1", {
      provider,
      timeoutMs: 5,
    });

    expect(result).toMatchObject({
      status: "safe_fallback",
      reasonCodes: ["PROVIDER_TIMEOUT"],
    });
  });

  it.each([
    [new Error("secret provider details"), "PROVIDER_ERROR"],
    [new AiFeedbackProviderError("blocked"), "PROVIDER_BLOCKED"],
    [new AiFeedbackProviderError("rate_limited"), "PROVIDER_RATE_LIMITED"],
    [new AiFeedbackProviderError("unavailable"), "PROVIDER_UNAVAILABLE"],
  ])("maps provider errors without exposing details", async (error, reason) => {
    const provider: AiFeedbackProvider = {
      providerType: "throwing-fake",
      generateFeedback: async () => {
        throw error;
      },
    };

    const result = await generateEntryFeedback("fictional-user", "entry-1", {
      provider,
    });

    expect(result.reasonCodes).toEqual([reason]);
    expect(JSON.stringify(result)).not.toContain("secret provider details");
  });

  it("falls back for malformed and unsafe provider output", async () => {
    const malformed = await generateEntryFeedback("fictional-user", "entry-1", {
      provider: new FakeAiFeedbackProvider("not-json"),
    });
    const unsafe = await generateEntryFeedback("fictional-user", "entry-1", {
      provider: new FakeAiFeedbackProvider({
        reflection: "你一定患有抑郁症。",
        suggestions: [],
      }),
    });

    expect(malformed.reasonCodes).toEqual(["PROVIDER_OUTPUT_INVALID"]);
    expect(unsafe.reasonCodes).toEqual(["PROVIDER_OUTPUT_UNSAFE"]);
  });

  it("emits only decision and stable reason codes to the audit logger", async () => {
    const events: unknown[] = [];
    const note = "这是一条不应进入日志的完整虚构日记正文。";
    getJournalEntryRecordMock.mockResolvedValue(createEntry(note));

    await generateEntryFeedback("fictional-user", "entry-1", {
      provider: new FakeAiFeedbackProvider(),
      auditLogger: {
        record: (event) => events.push(event),
      },
    });

    expect(events).toEqual([
      {
        decision: "allow_generation",
        reasonCodes: ["NORMAL_JOURNAL_CONTENT"],
      },
    ]);
    expect(JSON.stringify(events)).not.toContain(note);
    expect(JSON.stringify(events)).not.toMatch(/prompt|reflection|suggestion/i);
  });

  it("uses a clearly marked fallback when production provider is absent", async () => {
    const result = await generateEntryFeedback("fictional-user", "entry-1", {
      providerFactory: async () => null,
    });

    expect(result).toMatchObject({
      status: "safe_fallback",
      policyDecision: "safe_fallback",
      reasonCodes: ["PROVIDER_NOT_CONFIGURED"],
    });
    expect(requireAiProcessingConsentMock).not.toHaveBeenCalled();
  });

  it("does not call a configured provider without current AI consent", async () => {
    requireAiProcessingConsentMock.mockRejectedValue(
      new AiProcessingConsentRequiredError(),
    );
    const provider = new FakeAiFeedbackProvider();

    await expect(
      generateEntryFeedback("fictional-user", "entry-1", { provider }),
    ).rejects.toBeInstanceOf(AiProcessingConsentRequiredError);

    expect(provider.calls).toHaveLength(0);
  });
});
