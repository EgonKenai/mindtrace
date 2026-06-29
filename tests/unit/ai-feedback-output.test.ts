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
    [
      { ...validOutput, extra: "unknown" },
      "invalid",
      ["schema_validation_failed"],
    ],
    ["not-json", "invalid", ["schema_validation_failed"]],
    [
      { ...validOutput, reflection: "你一定患有抑郁症。" },
      "unsafe",
      [
        "forbidden_diagnosis_language",
        "unsafe_absolute_language",
        "missing_uncertainty_language",
      ],
    ],
    [
      { ...validOutput, suggestions: ["你应该停止服用药物。"] },
      "unsafe",
      ["forbidden_medication_advice"],
    ],
    [
      { ...validOutput, suggestions: ["可以吃两片镇静剂。"] },
      "unsafe",
      ["forbidden_medication_advice"],
    ],
    [
      { ...validOutput, suggestions: ["如果有自杀危险，先睡一觉。"] },
      "unsafe",
      ["unsafe_crisis_delay_language"],
    ],
    [
      { ...validOutput, reflection: "只有这个应用理解你。" },
      "unsafe",
      ["unsafe_dependency_language", "missing_uncertainty_language"],
    ],
    [
      { ...validOutput, reflection: "<script>alert(1)</script>" },
      "unsafe",
      ["unsafe_executable_content", "missing_uncertainty_language"],
    ],
    [
      { ...validOutput, reflection: "请拨打 123-456-7890。" },
      "unsafe",
      ["unsafe_unreviewed_contact_information", "missing_uncertainty_language"],
    ],
    [
      { ...validOutput, reflection: "今天的压力有所上升。" },
      "unsafe",
      ["missing_uncertainty_language"],
    ],
    [
      { ...validOutput, reflection: "睡眠不足导致了你的情绪问题。" },
      "unsafe",
      ["forbidden_causal_claim", "missing_uncertainty_language"],
    ],
  ])(
    "rejects invalid or unsafe provider output with stable reason codes",
    (output, reason, reasonCodes) => {
      expect(validateProviderOutput(output, "虚构测试日记。")).toEqual({
        success: false,
        reason,
        reasonCodes,
      });
    },
  );

  it("rejects too many or overlong suggestions", () => {
    expect(
      validateProviderOutput(
        { ...validOutput, suggestions: ["建议一", "建议二"] },
        "虚构测试日记。",
      ),
    ).toEqual({
      success: false,
      reason: "invalid",
      reasonCodes: ["schema_validation_failed"],
    });
    expect(
      validateProviderOutput(
        { ...validOutput, suggestions: ["长".repeat(241)] },
        "虚构测试日记。",
      ),
    ).toEqual({
      success: false,
      reason: "invalid",
      reasonCodes: ["schema_validation_failed"],
    });
  });

  it("rejects repetition of a substantial source-note segment", () => {
    const note =
      "这是一段完全虚构但应被视为敏感内容的测试日记原文，不应由模型逐字重复。";

    expect(
      validateProviderOutput(
        {
          reflection: `你的记录可能显示：${note}`,
          suggestions: [],
        },
        note,
      ),
    ).toEqual({
      success: false,
      reason: "unsafe",
      reasonCodes: ["raw_output_repetition"],
    });
  });
});
