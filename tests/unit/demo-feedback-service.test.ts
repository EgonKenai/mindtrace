import { describe, expect, it } from "vitest";

import { generateDemoReflection } from "@/server/services/demo-feedback-service";
import { FakeAiFeedbackProvider } from "../fixtures/fake-ai-feedback-provider";

describe("demo feedback service", () => {
  it("uses minimized demo input and does not require a user identifier", async () => {
    const provider = new FakeAiFeedbackProvider({
      reflection:
        "It may be useful to notice that today felt stressful without turning that into a fixed conclusion.",
      suggestions: [
        "If you want, you could consider writing down one small task to leave for tomorrow.",
      ],
    });

    const result = await generateDemoReflection(
      "Work felt stressful today, and I had trouble switching off after getting home.",
      "en",
      { provider },
    );

    expect(provider.calls).toHaveLength(1);
    expect(provider.calls[0]).toMatchObject({
      locale: "en",
      journal: {
        mood: 5,
        stress: 5,
        energy: 5,
        sleepHours: 7,
        sleepQuality: 5,
        eventTags: ["other"],
      },
      system: {
        contractVersion: "1",
        userContentIsUntrusted: true,
      },
    });
    expect(JSON.stringify(provider.calls[0])).not.toMatch(
      /uid|email|entryId|ownerId|cookie|token/i,
    );
    expect(result).toMatchObject({
      status: "generated",
      policyDecision: "allow_generation",
      reasonCodes: ["NORMAL_JOURNAL_CONTENT"],
    });
  });

  it("does not call the provider for crisis content", async () => {
    const provider = new FakeAiFeedbackProvider();
    const result = await generateDemoReflection(
      "I am going to kill myself now.",
      "en",
      { provider },
    );

    expect(provider.calls).toHaveLength(0);
    expect(result.status).toBe("crisis_redirect");
  });

  it("uses the existing safe fallback when the provider is not configured", async () => {
    const result = await generateDemoReflection(
      "Today was a little stressful, but I got through the main task.",
      "en",
      { providerFactory: async () => null },
    );

    expect(result).toMatchObject({
      status: "safe_fallback",
      policyDecision: "safe_fallback",
      reasonCodes: ["PROVIDER_NOT_CONFIGURED"],
    });
  });
});
