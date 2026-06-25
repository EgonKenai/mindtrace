import {
  FinishReason,
  HarmBlockThreshold,
  type GenerateContentParameters,
  type GenerateContentResponse,
} from "@google/genai";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createConfiguredAiFeedbackProvider,
  GEMINI_SAFETY_SETTINGS,
  GEMINI_STATE_POLICY,
  GeminiAiFeedbackProvider,
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

  it("returns no configured provider unless both server variables exist", () => {
    process.env.GEMINI_API_KEY = "fictional-test-key";
    expect(createConfiguredAiFeedbackProvider()).toBeNull();

    process.env.GEMINI_MODEL = "gemini-fictional-test-model";
    expect(createConfiguredAiFeedbackProvider()).toBeInstanceOf(
      GeminiAiFeedbackProvider,
    );
  });
});
