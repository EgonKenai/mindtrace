import type {
  AiPlanSuggestionProvider,
  AiPlanSuggestionProviderInput,
  AiPlanSuggestionProviderOptions,
} from "@/server/ai/plan-suggestion-provider";

export class FakeAiPlanSuggestionProvider implements AiPlanSuggestionProvider {
  readonly providerType = "fake-plan-suggestion";
  readonly calls: AiPlanSuggestionProviderInput[] = [];

  constructor(
    private readonly response: unknown = {
      description:
        "可以考虑用一个很小的学习和休息节奏计划，先观察是否适合自己。",
      linkedTags: ["study", "sleep"],
      rationale:
        "看起来最近的摘要里学习和睡眠标签较常见，也许可以从低压力行动开始。",
      suggestedActions: [
        {
          description: "如果你愿意，可以在晚上安排一小段收尾时间。",
          linkedTags: ["study"],
          suggestedDueInDays: 2,
          title: "安排一次学习收尾",
        },
      ],
      title: "可以考虑的学习休息草稿",
    },
  ) {}

  async generatePlanSuggestion(
    input: AiPlanSuggestionProviderInput,
    options: AiPlanSuggestionProviderOptions,
  ): Promise<unknown> {
    if (options.signal.aborted) {
      throw new Error("ABORTED");
    }

    this.calls.push(structuredClone(input));
    return this.response;
  }
}
