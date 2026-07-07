import { describe, expect, it, beforeEach, vi } from "vitest";

import { AiProcessingConsentRequiredError } from "@/server/http/responses";
import { FakeAiPlanSuggestionProvider } from "../fixtures/fake-ai-plan-suggestion-provider";

const mocks = vi.hoisted(() => ({
  createPlanSuggestionRecord: vi.fn(),
  createSuggestedPlanFromDraft: vi.fn(),
  getLongTermSummary: vi.fn(),
  getPlanSuggestionRecord: vi.fn(),
  listPlanSuggestionRecords: vi.fn(),
  requireAiProcessingConsent: vi.fn(),
  requireProductDataAccess: vi.fn(),
  updatePlanSuggestionStatusRecord: vi.fn(),
}));

vi.mock("@/server/services/product-access-service", () => ({
  requireAiProcessingConsent: mocks.requireAiProcessingConsent,
  requireProductDataAccess: mocks.requireProductDataAccess,
}));

vi.mock("@/server/services/long-term-summary-service", () => ({
  getLongTermSummary: mocks.getLongTermSummary,
}));

vi.mock("@/server/repositories/plan-suggestion-repository", () => ({
  createPlanSuggestionRecord: mocks.createPlanSuggestionRecord,
  getPlanSuggestionRecord: mocks.getPlanSuggestionRecord,
  listPlanSuggestionRecords: mocks.listPlanSuggestionRecords,
  updatePlanSuggestionStatusRecord: mocks.updatePlanSuggestionStatusRecord,
}));

vi.mock("@/server/services/plan-service", () => ({
  createSuggestedPlanFromDraft: mocks.createSuggestedPlanFromDraft,
}));

const { acceptPlanSuggestion, dismissPlanSuggestion, generatePlanSuggestion } =
  await import("@/server/services/plan-suggestion-service");

const timestamp = {
  toDate: () => new Date("2026-06-24T12:00:00.000Z"),
};

const readySummary = {
  endDate: "2026-06-24",
  energyAverage: 5,
  entryCount: 3,
  generatedAt: "2026-06-24T12:00:00.000Z",
  missingDays: ["2026-06-20"],
  moodAverage: 6,
  mostCommonTags: [{ count: 2, tag: "study" }],
  notablePatterns: ["可以考虑把这段摘要作为低风险回顾。"],
  schemaVersion: 1,
  sleepAverage: 6.5,
  sleepQualityAverage: 5,
  startDate: "2026-06-18",
  status: "ready",
  stressAverage: 5,
  summaryWindow: 7,
  timeZone: "Asia/Tokyo",
};

const suggestionRecord = {
  description: "可以考虑一个学习和休息草稿。",
  endDate: "2026-06-24",
  generatedAt: timestamp,
  id: "suggestion-1",
  linkedTags: ["study"],
  rationale: "看起来学习标签较常见。",
  safetyLabel: "low_risk",
  schemaVersion: 1,
  startDate: "2026-06-18",
  status: "draft",
  suggestedActions: [
    {
      description: "如果你愿意，可以做一次十分钟整理。",
      linkedTags: ["study"],
      suggestedDueInDays: 2,
      title: "温和整理任务",
    },
  ],
  summaryWindow: 7,
  title: "可以考虑的计划草稿",
  updatedAt: timestamp,
};

const englishProviderResponse = {
  description:
    "You could consider a low-pressure study and rest draft for the next few days.",
  linkedTags: ["study"],
  rationale: "The aggregate summary may show study as a common recent theme.",
  suggestedActions: [
    {
      description:
        "If you want, you could spend ten minutes organizing one small study task.",
      linkedTags: ["study"],
      suggestedDueInDays: 2,
      title: "Consider one small study wrap-up",
    },
  ],
  title: "Consider a study rest draft",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireProductDataAccess.mockResolvedValue({
    timeZone: "Asia/Tokyo",
    userId: "server-user",
  });
  mocks.requireAiProcessingConsent.mockResolvedValue(undefined);
  mocks.getLongTermSummary.mockResolvedValue(readySummary);
  mocks.createPlanSuggestionRecord.mockResolvedValue(suggestionRecord);
  mocks.getPlanSuggestionRecord.mockResolvedValue(suggestionRecord);
  mocks.updatePlanSuggestionStatusRecord.mockResolvedValue({
    ...suggestionRecord,
    status: "accepted",
  });
  mocks.createSuggestedPlanFromDraft.mockResolvedValue({
    actions: [],
    id: "plan-1",
    sourceType: "ai_suggested",
    title: "可以考虑的计划草稿",
  });
});

describe("AI plan suggestion service", () => {
  it("calls a fake provider with minimized summary input", async () => {
    const provider = new FakeAiPlanSuggestionProvider(englishProviderResponse);
    const result = await generatePlanSuggestion(
      "client-user-should-not-win",
      { summaryWindow: 7 },
      { provider },
    );

    expect(result.status).toBe("generated");
    expect(provider.calls).toHaveLength(1);
    expect(provider.calls[0]).toMatchObject({
      locale: "en",
      summary: {
        entryCount: 3,
        summaryWindow: 7,
      },
      system: {
        noAutoCreatePlan: true,
        outputMustBeDraftOnly: true,
      },
    });
    const serializedInput = JSON.stringify(provider.calls[0]);
    expect(serializedInput).not.toMatch(
      /uid|email|Cookie|token|Firestore|entryId|note|client-user/i,
    );
    expect(mocks.getLongTermSummary).toHaveBeenCalledWith("server-user", {
      locale: "en",
      window: 7,
    });
    expect(mocks.createPlanSuggestionRecord).toHaveBeenCalledWith(
      "server-user",
      expect.objectContaining({
        title: englishProviderResponse.title,
      }),
    );
  });

  it("keeps Chinese plan suggestion drafts valid for zh-CN requests", async () => {
    const provider = new FakeAiPlanSuggestionProvider();
    const result = await generatePlanSuggestion(
      "server-user",
      { locale: "zh-CN", summaryWindow: 7 },
      { provider },
    );

    expect(result.status).toBe("generated");
    expect(provider.calls[0]?.locale).toBe("zh-CN");
    expect(mocks.getLongTermSummary).toHaveBeenCalledWith("server-user", {
      locale: "zh-CN",
      window: 7,
    });
  });

  it("does not accept Chinese plan suggestion drafts for English requests", async () => {
    await expect(
      generatePlanSuggestion(
        "server-user",
        { locale: "en", summaryWindow: 7 },
        { provider: new FakeAiPlanSuggestionProvider() },
      ),
    ).resolves.toMatchObject({
      reasonCodes: ["PROVIDER_OUTPUT_UNSAFE"],
      status: "safe_fallback",
      suggestion: null,
    });
  });

  it("does not call the provider for insufficient data or missing AI consent", async () => {
    const provider = new FakeAiPlanSuggestionProvider();
    mocks.getLongTermSummary.mockResolvedValueOnce({
      ...readySummary,
      entryCount: 0,
      status: "insufficient_data",
    });

    await expect(
      generatePlanSuggestion("server-user", { summaryWindow: 7 }, { provider }),
    ).resolves.toMatchObject({ status: "insufficient_data" });
    expect(provider.calls).toHaveLength(0);

    mocks.requireAiProcessingConsent.mockRejectedValueOnce(
      new AiProcessingConsentRequiredError(),
    );
    await expect(
      generatePlanSuggestion("server-user", { summaryWindow: 7 }, { provider }),
    ).rejects.toBeInstanceOf(AiProcessingConsentRequiredError);
    expect(provider.calls).toHaveLength(0);
  });

  it("returns safe fallback for unsafe output and timeout", async () => {
    await expect(
      generatePlanSuggestion(
        "server-user",
        { summaryWindow: 7 },
        {
          provider: new FakeAiPlanSuggestionProvider({
            description: "你一定需要药物。",
            linkedTags: [],
            rationale: "你患有抑郁症。",
            suggestedActions: [],
            title: "诊断计划",
          }),
        },
      ),
    ).resolves.toMatchObject({
      reasonCodes: ["PROVIDER_OUTPUT_INVALID"],
      status: "safe_fallback",
    });

    await expect(
      generatePlanSuggestion(
        "server-user",
        { summaryWindow: 7 },
        {
          provider: {
            providerType: "slow",
            generatePlanSuggestion: () => new Promise(() => {}),
          },
          timeoutMs: 5,
        },
      ),
    ).resolves.toMatchObject({
      reasonCodes: ["PROVIDER_TIMEOUT"],
      status: "safe_fallback",
    });
  });

  it("accepts a draft by creating a formal ai_suggested plan once", async () => {
    const result = await acceptPlanSuggestion("server-user", "suggestion-1");

    expect(mocks.createSuggestedPlanFromDraft).toHaveBeenCalledWith(
      "server-user",
      expect.objectContaining({
        startDate: "2026-06-18",
        title: "可以考虑的计划草稿",
      }),
    );
    expect(mocks.updatePlanSuggestionStatusRecord).toHaveBeenCalledWith(
      "server-user",
      "suggestion-1",
      "accepted",
    );
    expect(result.plan.sourceType).toBe("ai_suggested");
  });

  it("does not accept an accepted or dismissed draft", async () => {
    for (const status of ["accepted", "dismissed"] as const) {
      mocks.getPlanSuggestionRecord.mockResolvedValueOnce({
        ...suggestionRecord,
        status,
      });
      await expect(
        acceptPlanSuggestion("server-user", "suggestion-1"),
      ).rejects.toThrow("INVALID_REQUEST");
    }
  });

  it("dismisses only a draft suggestion", async () => {
    await expect(
      dismissPlanSuggestion("server-user", "suggestion-1"),
    ).resolves.toMatchObject({ status: "accepted" });

    mocks.getPlanSuggestionRecord.mockResolvedValueOnce({
      ...suggestionRecord,
      status: "accepted",
    });
    await expect(
      dismissPlanSuggestion("server-user", "suggestion-1"),
    ).rejects.toThrow("INVALID_REQUEST");
  });
});
