import type {
  AiFeedbackProvider,
  AiFeedbackProviderInput,
  AiFeedbackProviderOptions,
} from "@/server/ai/provider";

export class FakeAiFeedbackProvider implements AiFeedbackProvider {
  readonly providerType = "fake";
  readonly calls: AiFeedbackProviderInput[] = [];

  constructor(
    private readonly response: unknown = {
      reflection: "你的记录可能显示今天的压力和精力有所波动。",
      suggestions: ["可以短暂离开屏幕，做一次温和的伸展。"],
    },
  ) {}

  async generateFeedback(
    input: AiFeedbackProviderInput,
    options: AiFeedbackProviderOptions,
  ): Promise<unknown> {
    if (options.signal.aborted) {
      throw new Error("ABORTED");
    }

    this.calls.push(structuredClone(input));
    return this.response;
  }
}
