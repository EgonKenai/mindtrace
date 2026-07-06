import { beforeEach, describe, expect, it, vi } from "vitest";

import { AiLongTermInsightProviderError } from "@/server/ai/long-term-insight-provider";
import { AiProcessingConsentRequiredError } from "@/server/http/responses";
import { FakeAiLongTermInsightProvider } from "../fixtures/fake-ai-long-term-insight-provider";

const mocks = vi.hoisted(() => ({
  createLongTermInsightRecord: vi.fn(),
  getLongTermInsightRecord: vi.fn(),
  getLongTermSummary: vi.fn(),
  listLongTermInsightRecords: vi.fn(),
  requireAiProcessingConsent: vi.fn(),
  requireProductDataAccess: vi.fn(),
  updateLongTermInsightStatusRecord: vi.fn(),
}));

vi.mock("@/server/services/product-access-service", () => ({
  requireAiProcessingConsent: mocks.requireAiProcessingConsent,
  requireProductDataAccess: mocks.requireProductDataAccess,
}));

vi.mock("@/server/services/long-term-summary-service", () => ({
  getLongTermSummary: mocks.getLongTermSummary,
}));

vi.mock("@/server/repositories/long-term-insight-repository", () => ({
  createLongTermInsightRecord: mocks.createLongTermInsightRecord,
  getLongTermInsightRecord: mocks.getLongTermInsightRecord,
  listLongTermInsightRecords: mocks.listLongTermInsightRecords,
  updateLongTermInsightStatusRecord: mocks.updateLongTermInsightStatusRecord,
}));

const { dismissLongTermInsight, generateLongTermInsight, saveLongTermInsight } =
  await import("@/server/services/long-term-insight-service");

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

const insightRecord = {
  endDate: "2026-06-24",
  generatedAt: timestamp,
  gentleSuggestions: [
    {
      description: "如果你愿意，可以考虑一次温和观察。",
      riskLevel: "low",
      suggestedActionType: "reflection",
      title: "可以考虑温和观察",
    },
  ],
  id: "insight-1",
  overview: "看起来这段摘要可能适合低风险回顾。",
  patterns: [
    {
      confidence: "low",
      description: "可能有学习相关线索。",
      relatedTags: ["study"],
      title: "可能的学习线索",
    },
  ],
  planSuggestionRefs: [],
  safetyLabel: "low_risk",
  schemaVersion: 1,
  sourceSummarySnapshot: readySummary,
  startDate: "2026-06-18",
  status: "draft",
  strengths: ["也许持续记录值得保留。"],
  summaryWindow: 7,
  title: "可以考虑的洞察草稿",
  updatedAt: timestamp,
  watchPoints: ["可以考虑继续观察睡眠。"],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireProductDataAccess.mockResolvedValue({
    timeZone: "Asia/Tokyo",
    userId: "server-user",
  });
  mocks.requireAiProcessingConsent.mockResolvedValue(undefined);
  mocks.getLongTermSummary.mockResolvedValue(readySummary);
  mocks.createLongTermInsightRecord.mockResolvedValue(insightRecord);
  mocks.getLongTermInsightRecord.mockResolvedValue(insightRecord);
  mocks.updateLongTermInsightStatusRecord.mockResolvedValue({
    ...insightRecord,
    status: "saved",
  });
});

describe("AI long-term insight service", () => {
  it("calls a fake provider with minimized summary input", async () => {
    const provider = new FakeAiLongTermInsightProvider();
    const result = await generateLongTermInsight(
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
        contractVersion: "long-term-insight-v1",
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
  });

  it("does not call the provider for insufficient data or missing AI consent", async () => {
    const provider = new FakeAiLongTermInsightProvider();
    mocks.getLongTermSummary.mockResolvedValueOnce({
      ...readySummary,
      entryCount: 0,
      status: "insufficient_data",
    });

    await expect(
      generateLongTermInsight(
        "server-user",
        { summaryWindow: 7 },
        { provider },
      ),
    ).resolves.toMatchObject({ status: "insufficient_data" });
    expect(provider.calls).toHaveLength(0);

    mocks.requireAiProcessingConsent.mockRejectedValueOnce(
      new AiProcessingConsentRequiredError(),
    );
    await expect(
      generateLongTermInsight(
        "server-user",
        { summaryWindow: 7 },
        { provider },
      ),
    ).rejects.toBeInstanceOf(AiProcessingConsentRequiredError);
    expect(provider.calls).toHaveLength(0);
  });

  it("returns safe fallback for invalid output and timeout", async () => {
    await expect(
      generateLongTermInsight(
        "server-user",
        { summaryWindow: 7 },
        { provider: new FakeAiLongTermInsightProvider("raw provider output") },
      ),
    ).resolves.toMatchObject({
      reasonCodes: ["PROVIDER_OUTPUT_INVALID"],
      status: "safe_fallback",
    });

    await expect(
      generateLongTermInsight(
        "server-user",
        { summaryWindow: 7 },
        {
          provider: {
            providerType: "slow",
            generateLongTermInsight: () => new Promise(() => {}),
          },
          timeoutMs: 5,
        },
      ),
    ).resolves.toMatchObject({
      reasonCodes: ["PROVIDER_TIMEOUT"],
      status: "safe_fallback",
    });
  });

  it("returns safe fallback when the provider is unavailable", async () => {
    await expect(
      generateLongTermInsight(
        "server-user",
        { summaryWindow: 7 },
        {
          provider: {
            providerType: "unavailable",
            generateLongTermInsight: () => {
              throw new AiLongTermInsightProviderError("unavailable");
            },
          },
        },
      ),
    ).resolves.toMatchObject({
      reasonCodes: ["PROVIDER_UNAVAILABLE"],
      status: "safe_fallback",
    });
  });

  it("saves and dismisses only draft insights", async () => {
    await expect(
      saveLongTermInsight("server-user", "insight-1"),
    ).resolves.toMatchObject({
      status: "saved",
    });
    expect(mocks.updateLongTermInsightStatusRecord).toHaveBeenCalledWith(
      "server-user",
      "insight-1",
      "saved",
    );

    mocks.updateLongTermInsightStatusRecord.mockResolvedValueOnce({
      ...insightRecord,
      status: "dismissed",
    });
    await expect(
      dismissLongTermInsight("server-user", "insight-1"),
    ).resolves.toMatchObject({ status: "dismissed" });

    for (const status of ["saved", "dismissed"] as const) {
      mocks.getLongTermInsightRecord.mockResolvedValueOnce({
        ...insightRecord,
        status,
      });
      await expect(
        saveLongTermInsight("server-user", "insight-1"),
      ).rejects.toThrow("INVALID_REQUEST");
    }
  });
});
