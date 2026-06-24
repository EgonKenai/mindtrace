import { describe, expect, it } from "vitest";

import { validateProviderOutput } from "@/server/ai/output-validation";

const validOutput = {
  reflection: "你的记录可能显示今天的压力有所上升。",
  suggestions: ["可以短暂离开屏幕，做一次温和的伸展。"],
};

describe("AI feedback provider output validation", () => {
  it("accepts a short, uncertain, low-risk response", () => {
    expect(validateProviderOutput(validOutput, "虚构测试日记。")).toEqual({
      success: true,
      output: validOutput,
    });
  });

  it.each([
    [{ ...validOutput, extra: "unknown" }, "invalid"],
    ["not-json", "invalid"],
    [{ ...validOutput, reflection: "你一定患有抑郁症。" }, "unsafe"],
    [{ ...validOutput, suggestions: ["你应该停止服用药物。"] }, "unsafe"],
    [{ ...validOutput, suggestions: ["可以吃两片镇静剂。"] }, "unsafe"],
    [{ ...validOutput, suggestions: ["如果有自杀危险，先睡一觉。"] }, "unsafe"],
    [{ ...validOutput, reflection: "只有这个应用理解你。" }, "unsafe"],
    [{ ...validOutput, reflection: "<script>alert(1)</script>" }, "unsafe"],
    [{ ...validOutput, reflection: "请拨打 123-456-7890。" }, "unsafe"],
    [{ ...validOutput, reflection: "今天的压力有所上升。" }, "unsafe"],
    [{ ...validOutput, reflection: "睡眠不足导致了你的情绪问题。" }, "unsafe"],
  ])("rejects invalid or unsafe provider output", (output, reason) => {
    expect(validateProviderOutput(output, "虚构测试日记。")).toEqual({
      success: false,
      reason,
    });
  });

  it("rejects too many or overlong suggestions", () => {
    expect(
      validateProviderOutput(
        { ...validOutput, suggestions: ["建议一", "建议二"] },
        "虚构测试日记。",
      ),
    ).toEqual({ success: false, reason: "invalid" });
    expect(
      validateProviderOutput(
        { ...validOutput, suggestions: ["长".repeat(241)] },
        "虚构测试日记。",
      ),
    ).toEqual({ success: false, reason: "invalid" });
  });

  it("rejects repetition of a substantial source-note segment", () => {
    const note =
      "这是一段完全虚构但应被视为敏感内容的测试日记原文，不应由模型逐字重复。";

    expect(
      validateProviderOutput(
        {
          reflection: `你的记录是：${note}`,
          suggestions: [],
        },
        note,
      ),
    ).toEqual({ success: false, reason: "unsafe" });
  });
});
