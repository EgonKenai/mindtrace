import {
  FinishReason,
  HarmBlockThreshold,
  type GenerateContentParameters,
  type GenerateContentResponse,
} from "@google/genai";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createConfiguredAiLongTermInsightProvider,
  createConfiguredAiFeedbackProvider,
  createConfiguredAiPlanSuggestionProvider,
  GEMINI_SAFETY_SETTINGS,
  GEMINI_STATE_POLICY,
  GeminiAiFeedbackProvider,
  GeminiAiLongTermInsightProvider,
  GeminiAiPlanSuggestionProvider,
  type GeminiModelsClient,
} from "@/server/ai/gemini-provider";

const providerInput = {
  system: {
    contractVersion: "1" as const,
    userContentIsUntrusted: true as const,
  },
  journal: {
    mood: 6,
    stress: 4,
    energy: 7,
    sleepHours: 7.5,
    sleepQuality: 8,
    eventTags: ["work", "sleep"],
    note: "完全虚构的 Gemini Provider 测试记录。",
  },
  locale: "zh-CN" as const,
  trendSummary: {
    recordedDays: 3,
    totalEntries: 4,
  },
};

const planSuggestionInput = {
  locale: "zh-CN" as const,
  summary: {
    energyAverage: 5,
    entryCount: 4,
    missingDays: ["2026-06-22"],
    moodAverage: 6,
    mostCommonTags: [{ count: 2, tag: "study" as const }],
    notablePatterns: ["看起来学习和睡眠相关记录较常见。"],
    sleepAverage: 6.5,
    sleepQualityAverage: 5,
    stressAverage: 5,
    summaryWindow: 7 as const,
  },
  system: {
    contractVersion: "plan-suggestion-v1" as const,
    noAutoCreatePlan: true as const,
    outputMustBeDraftOnly: true as const,
    userContentIsUntrusted: true as const,
  },
};

const longTermInsightInput = {
  locale: "zh-CN" as const,
  summary: {
    endDate: "2026-06-24",
    energyAverage: 5,
    entryCount: 4,
    missingDays: ["2026-06-22"],
    moodAverage: 6,
    mostCommonTags: [{ count: 2, tag: "study" as const }],
    notablePatterns: ["看起来学习和睡眠相关记录较常见。"],
    sleepAverage: 6.5,
    sleepQualityAverage: 5,
    startDate: "2026-06-18",
    stressAverage: 5,
    summaryWindow: 7 as const,
  },
  system: {
    contractVersion: "long-term-insight-v1" as const,
    outputMustBeDraftOnly: true as const,
    userContentIsUntrusted: true as const,
  },
};

function responseWithText(text: string): GenerateContentResponse {
  return {
    candidates: [
      {
        finishReason: FinishReason.STOP,
        content: {
          role: "model",
          parts: [{ text }],
        },
      },
    ],
  } as GenerateContentResponse;
}

function createClient(
  implementation: (
    parameters: GenerateContentParameters,
  ) => Promise<GenerateContentResponse>,
): GeminiModelsClient & {
  generateContent: ReturnType<typeof vi.fn<typeof implementation>>;
} {
  return {
    generateContent: vi.fn(implementation),
  };
}

function createProvider(client: GeminiModelsClient) {
  return new GeminiAiFeedbackProvider({
    apiKey: "fictional-test-key",
    client,
    model: "gemini-fictional-test-model",
  });
}

function createPlanProvider(client: GeminiModelsClient) {
  return new GeminiAiPlanSuggestionProvider({
    apiKey: "fictional-test-key",
    client,
    model: "gemini-fictional-test-model",
  });
}

function createLongTermInsightProvider(client: GeminiModelsClient) {
  return new GeminiAiLongTermInsightProvider({
    apiKey: "fictional-test-key",
    client,
    model: "gemini-fictional-test-model",
  });
}

afterEach(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
  vi.restoreAllMocks();
});

describe("GeminiAiFeedbackProvider", () => {
  it("uses one stateless structured generateContent request with minimal input", async () => {
    const client = createClient(async () =>
      responseWithText(
        JSON.stringify({
          reflection: "你的记录可能显示今天的压力有所波动。",
          suggestions: ["可以短暂离开屏幕，做一次温和的伸展。"],
        }),
      ),
    );
    const provider = createProvider(client);
    const controller = new AbortController();

    await expect(
      provider.generateFeedback(providerInput, {
        signal: controller.signal,
      }),
    ).resolves.toEqual({
      reflection: "你的记录可能显示今天的压力有所波动。",
      suggestions: ["可以短暂离开屏幕，做一次温和的伸展。"],
    });

    expect(client.generateContent).toHaveBeenCalledTimes(1);
    const request = client.generateContent.mock.calls[0][0];
    expect(request.model).toBe("gemini-fictional-test-model");
    expect(request.config).toMatchObject({
      abortSignal: controller.signal,
      candidateCount: 1,
      maxOutputTokens: 512,
      responseMimeType: "application/json",
      temperature: 0.2,
      topP: 0.8,
    });
    expect(request.config?.responseJsonSchema).toMatchObject({
      type: "object",
      additionalProperties: false,
      required: ["reflection", "suggestions"],
      properties: {
        reflection: {
          description: expect.stringMatching(/可能|may|might|could/),
        },
        suggestions: {
          description: expect.stringMatching(/可以考虑|could consider/),
        },
      },
    });
    expect(request.config?.safetySettings).toEqual(GEMINI_SAFETY_SETTINGS);
    expect(GEMINI_STATE_POLICY).toEqual({
      api: "models.generateContent",
      background: false,
      previousInteractionId: false,
      store: false,
      tools: false,
    });
    expect(
      request.config?.safetySettings?.every(
        (setting) =>
          setting.threshold === HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      ),
    ).toBe(true);
    expect(request.config?.systemInstruction).toEqual(expect.any(String));
    expect(String(request.config?.systemInstruction)).toMatch(
      /Do not diagnose|untrusted data|Do not provide medication/,
    );
    expect(String(request.config?.systemInstruction)).toMatch(
      /reflection must include|可能|may|might|could/,
    );

    const serializedRequest = JSON.stringify(request);
    expect(serializedRequest).not.toContain("fictional-test-key");
    expect(serializedRequest).not.toContain('"store":true');
    expect(serializedRequest).not.toContain('"store":false');
    expect(request.config).not.toHaveProperty("tools");
    expect(request).not.toHaveProperty("previous_interaction_id");

    const userText = (
      request.contents as Array<{ parts: Array<{ text: string }> }>
    )[0].parts[0].text;
    const userPayload = JSON.parse(userText) as Record<string, unknown>;
    expect(userPayload).toEqual({
      locale: "zh-CN",
      journal: providerInput.journal,
      trendSummary: providerInput.trendSummary,
    });
    expect(JSON.stringify(userPayload)).not.toMatch(
      /uid|email|entryId|cookie|token|firestore/i,
    );
  });

  it.each([
    {
      promptFeedback: { blockReason: "SAFETY" },
    },
    {
      candidates: [{ finishReason: FinishReason.SAFETY }],
    },
  ])(
    "maps safety-blocked responses without exposing content",
    async (response) => {
      const client = createClient(
        async () => response as GenerateContentResponse,
      );

      await expect(
        createProvider(client).generateFeedback(providerInput, {
          signal: new AbortController().signal,
        }),
      ).rejects.toMatchObject({
        code: "blocked",
      });
    },
  );

  it("returns null for an empty candidate response", async () => {
    const client = createClient(
      async () => ({ candidates: [] }) as unknown as GenerateContentResponse,
    );

    await expect(
      createProvider(client).generateFeedback(providerInput, {
        signal: new AbortController().signal,
      }),
    ).resolves.toBeNull();
  });

  it("returns malformed JSON for the local strict validator to reject", async () => {
    const client = createClient(async () => responseWithText("{not-json"));

    await expect(
      createProvider(client).generateFeedback(providerInput, {
        signal: new AbortController().signal,
      }),
    ).resolves.toBe("{not-json");
  });

  it.each([429, 502, 503])(
    "retries transient status %i at most once",
    async (status) => {
      const client = createClient(async () => {
        if (client.generateContent.mock.calls.length === 1) {
          throw { status };
        }

        return responseWithText(
          JSON.stringify({
            reflection: "你的记录可能显示今天有一些压力。",
            suggestions: [],
          }),
        );
      });

      await expect(
        createProvider(client).generateFeedback(providerInput, {
          signal: new AbortController().signal,
        }),
      ).resolves.toMatchObject({
        reflection: "你的记录可能显示今天有一些压力。",
      });
      expect(client.generateContent).toHaveBeenCalledTimes(2);
    },
  );

  it.each([
    [429, "rate_limited"],
    [502, "unavailable"],
    [503, "unavailable"],
  ] as const)(
    "stops after one retry for repeated status %i",
    async (status, code) => {
      const client = createClient(async () => {
        throw { status };
      });

      await expect(
        createProvider(client).generateFeedback(providerInput, {
          signal: new AbortController().signal,
        }),
      ).rejects.toMatchObject({ code });
      expect(client.generateContent).toHaveBeenCalledTimes(2);
    },
  );

  it("does not retry other SDK errors or log sensitive values", async () => {
    const consoleSpies = [
      vi.spyOn(console, "log").mockImplementation(() => {}),
      vi.spyOn(console, "warn").mockImplementation(() => {}),
      vi.spyOn(console, "error").mockImplementation(() => {}),
    ];
    const client = createClient(async () => {
      throw {
        status: 400,
        message:
          "fictional-test-key full prompt raw model output and journal text",
      };
    });

    await expect(
      createProvider(client).generateFeedback(providerInput, {
        signal: new AbortController().signal,
      }),
    ).rejects.toMatchObject({
      code: "unavailable",
    });
    expect(client.generateContent).toHaveBeenCalledTimes(1);
    for (const spy of consoleSpies) {
      expect(spy).not.toHaveBeenCalled();
    }
  });

  it("returns no configured providers unless both server variables exist", () => {
    process.env.GEMINI_API_KEY = "fictional-test-key";
    expect(createConfiguredAiFeedbackProvider()).toBeNull();
    expect(createConfiguredAiPlanSuggestionProvider()).toBeNull();
    expect(createConfiguredAiLongTermInsightProvider()).toBeNull();

    process.env.GEMINI_MODEL = "gemini-fictional-test-model";
    expect(createConfiguredAiFeedbackProvider()).toBeInstanceOf(
      GeminiAiFeedbackProvider,
    );
    expect(createConfiguredAiPlanSuggestionProvider()).toBeInstanceOf(
      GeminiAiPlanSuggestionProvider,
    );
    expect(createConfiguredAiLongTermInsightProvider()).toBeInstanceOf(
      GeminiAiLongTermInsightProvider,
    );
  });

  it("uses the same Gemini client boundary for plan suggestion drafts", async () => {
    const client = createClient(async () =>
      responseWithText(
        JSON.stringify({
          title: "可以考虑的学习休息草稿",
          description: "看起来可以考虑用一个温和节奏整理学习和休息。",
          linkedTags: ["study"],
          rationale: "可能学习标签较常见，适合先做低风险尝试。",
          suggestedActions: [
            {
              title: "可以考虑十分钟整理",
              description: "如果你愿意，可以整理明天最小的一项学习任务。",
              linkedTags: ["study"],
              suggestedDueInDays: 1,
            },
          ],
        }),
      ),
    );

    await expect(
      createPlanProvider(client).generatePlanSuggestion(planSuggestionInput, {
        signal: new AbortController().signal,
      }),
    ).resolves.toMatchObject({
      title: "可以考虑的学习休息草稿",
    });

    const request = client.generateContent.mock.calls[0][0];
    expect(request.model).toBe("gemini-fictional-test-model");
    expect(request.config).toMatchObject({
      candidateCount: 1,
      responseMimeType: "application/json",
      temperature: 0.2,
    });
    expect(request.config?.safetySettings).toEqual(GEMINI_SAFETY_SETTINGS);
    expect(request.config?.responseJsonSchema).toMatchObject({
      additionalProperties: false,
      required: [
        "title",
        "description",
        "linkedTags",
        "rationale",
        "suggestedActions",
      ],
    });
    expect(String(request.config?.systemInstruction)).toMatch(
      /draft|not diagnosis|user must explicitly confirm/i,
    );

    const userText = (
      request.contents as Array<{ parts: Array<{ text: string }> }>
    )[0].parts[0].text;
    const serializedPayload = JSON.stringify(JSON.parse(userText));
    expect(serializedPayload).toContain("summary");
    expect(serializedPayload).not.toMatch(
      /uid|email|entryId|cookie|token|firestore|note/i,
    );
    expect(serializedPayload).not.toContain("fictional-test-key");
  });

  it("uses the same Gemini client boundary for long-term insight drafts", async () => {
    const client = createClient(async () =>
      responseWithText(
        JSON.stringify({
          title: "可以考虑的长期洞察草稿",
          overview: "看起来这段时间可能适合继续观察学习和休息节奏。",
          patterns: [
            {
              title: "可能的学习节奏线索",
              description: "也许学习标签较常见，可以低风险观察。",
              confidence: "low",
              relatedTags: ["study"],
            },
          ],
          strengths: ["可能已经在持续记录。"],
          watchPoints: ["可以考虑继续观察睡眠变化。"],
          gentleSuggestions: [
            {
              title: "可以考虑一次温和复盘",
              description: "如果你愿意，可以写下明天一个很小的学习步骤。",
              riskLevel: "low",
              suggestedActionType: "reflection",
            },
          ],
          planSuggestionRefs: [],
        }),
      ),
    );

    await expect(
      createLongTermInsightProvider(client).generateLongTermInsight(
        longTermInsightInput,
        {
          signal: new AbortController().signal,
        },
      ),
    ).resolves.toMatchObject({
      title: "可以考虑的长期洞察草稿",
    });

    const request = client.generateContent.mock.calls[0][0];
    expect(request.model).toBe("gemini-fictional-test-model");
    expect(request.config).toMatchObject({
      candidateCount: 1,
      responseMimeType: "application/json",
      temperature: 0.2,
    });
    expect(request.config?.safetySettings).toEqual(GEMINI_SAFETY_SETTINGS);
    expect(request.config?.responseJsonSchema).toMatchObject({
      additionalProperties: false,
      required: [
        "title",
        "overview",
        "patterns",
        "strengths",
        "watchPoints",
        "gentleSuggestions",
        "planSuggestionRefs",
      ],
    });
    expect(request.config?.responseJsonSchema).toMatchObject({
      properties: {
        gentleSuggestions: {
          items: {
            properties: {
              suggestedActionType: {
                enum: expect.arrayContaining(["reflection", "planning"]),
              },
            },
          },
        },
        patterns: {
          items: {
            properties: {
              relatedTags: {
                items: {
                  enum: expect.arrayContaining(["study", "sleep"]),
                },
              },
            },
          },
        },
      },
    });
    expect(String(request.config?.systemInstruction)).toMatch(
      /draft|not diagnosis|aggregate summary|strict JSON|controlled event tag IDs/i,
    );

    const userText = (
      request.contents as Array<{ parts: Array<{ text: string }> }>
    )[0].parts[0].text;
    const serializedPayload = JSON.stringify(JSON.parse(userText));
    expect(serializedPayload).toContain("summary");
    expect(serializedPayload).not.toMatch(
      /uid|email|entryId|cookie|token|firestore|note/i,
    );
    expect(serializedPayload).not.toContain("fictional-test-key");
  });

  it("parses fenced long-term insight JSON before local strict validation", async () => {
    const client = createClient(async () =>
      responseWithText(`\`\`\`json
${JSON.stringify({
  title: "Optional long-term insight draft",
  overview: "This may be a useful low-risk reflection on the recent summary.",
  patterns: [
    {
      title: "Possible study and rest rhythm",
      description:
        "The aggregate data might suggest a gentle link between study and rest patterns.",
      confidence: "low",
      relatedTags: ["study", "sleep"],
    },
  ],
  strengths: [],
  watchPoints: [],
  gentleSuggestions: [
    {
      title: "Consider one small review",
      description:
        "If you want, you could consider writing one small observation before planning anything.",
      riskLevel: "low",
      suggestedActionType: "reflection",
    },
  ],
  planSuggestionRefs: [],
})}
\`\`\``),
    );

    await expect(
      createLongTermInsightProvider(client).generateLongTermInsight(
        longTermInsightInput,
        {
          signal: new AbortController().signal,
        },
      ),
    ).resolves.toMatchObject({
      title: "Optional long-term insight draft",
      patterns: [
        {
          relatedTags: ["study", "sleep"],
        },
      ],
    });
  });
});
