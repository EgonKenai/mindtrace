import type {
  AiLongTermInsightProvider,
  AiLongTermInsightProviderInput,
  AiLongTermInsightProviderOptions,
} from "@/server/ai/long-term-insight-provider";

export class FakeAiLongTermInsightProvider implements AiLongTermInsightProvider {
  readonly providerType = "fake-long-term-insight";
  readonly calls: AiLongTermInsightProviderInput[] = [];

  constructor(
    private readonly response: unknown = {
      gentleSuggestions: [
        {
          description:
            "如果你愿意，可以考虑先安排一个很小的学习收尾或休息动作。",
          riskLevel: "low",
          suggestedActionType: "learning",
          title: "可以考虑一个小收尾",
        },
      ],
      overview:
        "看起来这段时间的记录可以作为一个低风险回顾，也许适合先观察学习和睡眠节奏。",
      patterns: [
        {
          confidence: "low",
          description: "可能学习和睡眠标签出现较多，可以作为后续自我观察线索。",
          relatedTags: ["study", "sleep"],
          title: "可能的学习与休息节奏",
        },
      ],
      planSuggestionRefs: [],
      strengths: ["你可能已经在持续记录和观察自己的状态。"],
      title: "可以考虑的长期洞察草稿",
      watchPoints: ["也许可以继续观察睡眠时长和精力之间的变化。"],
    },
  ) {}

  async generateLongTermInsight(
    input: AiLongTermInsightProviderInput,
    options: AiLongTermInsightProviderOptions,
  ): Promise<unknown> {
    if (options.signal.aborted) {
      throw new Error("ABORTED");
    }

    this.calls.push(structuredClone(input));
    return this.response;
  }
}
