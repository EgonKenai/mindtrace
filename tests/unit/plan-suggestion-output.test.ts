import { describe, expect, it } from "vitest";

import {
  planSuggestionRequestSchema,
  providerPlanSuggestionOutputSchema,
} from "@/lib/validation/plan-suggestions";
import { validatePlanSuggestionProviderOutput } from "@/server/ai/plan-suggestion-output-validation";

const validOutput = {
  description: "可以考虑从一个较小的学习和睡眠节奏开始观察。",
  linkedTags: ["study", "sleep"],
  rationale: "看起来学习和睡眠是最近摘要里的常见主题。",
  suggestedActions: [
    {
      description: "如果你愿意，可以在睡前留出十分钟整理明天任务。",
      linkedTags: ["study"],
      suggestedDueInDays: 2,
      title: "安排温和的学习收尾",
    },
  ],
  title: "可以考虑的学习休息草稿",
};

describe("AI plan suggestion schemas and output safety", () => {
  it("accepts a valid summary window and rejects unknown fields", () => {
    expect(planSuggestionRequestSchema.parse({ summaryWindow: "14" })).toEqual({
      locale: "en",
      summaryWindow: 14,
    });

    expect(
      planSuggestionRequestSchema.parse({ locale: "en", summaryWindow: 7 }),
    ).toEqual({
      locale: "en",
      summaryWindow: 7,
    });

    expect(() =>
      planSuggestionRequestSchema.parse({
        summaryWindow: 7,
        uid: "client-user-should-not-win",
      }),
    ).toThrow();
  });

  it("validates suggested actions and linked tags", () => {
    expect(providerPlanSuggestionOutputSchema.parse(validOutput)).toMatchObject(
      {
        title: validOutput.title,
      },
    );

    expect(() =>
      providerPlanSuggestionOutputSchema.parse({
        ...validOutput,
        suggestedActions: [
          {
            ...validOutput.suggestedActions[0],
            linkedTags: ["study", "study"],
          },
        ],
      }),
    ).toThrow();
  });

  it("accepts low-risk draft language", () => {
    const result = validatePlanSuggestionProviderOutput(validOutput);

    expect(result.success).toBe(true);
  });

  it.each([
    [
      { ...validOutput, rationale: "你一定患有抑郁症。" },
      "forbidden_diagnosis_language",
    ],
    [
      { ...validOutput, description: "你必须停止服用药物。" },
      "forbidden_medication_advice",
    ],
    [
      { ...validOutput, title: "保证有效的计划" },
      "forbidden_treatment_promise",
    ],
    [
      { ...validOutput, description: "唯一办法是每天完成全部任务。" },
      "unsafe_absolute_language",
    ],
    [
      { ...validOutput, rationale: "<script>alert('x')</script>" },
      "unsafe_executable_content",
    ],
  ])("rejects unsafe provider output %#", (output, reasonCode) => {
    const result = validatePlanSuggestionProviderOutput(output);

    expect(result).toMatchObject({
      success: false,
      reason: "unsafe",
      reasonCodes: expect.arrayContaining([reasonCode]),
    });
  });

  it("rejects missing fields and output without low-risk language", () => {
    expect(validatePlanSuggestionProviderOutput("not-json")).toMatchObject({
      success: false,
      reasonCodes: ["schema_validation_failed"],
    });
    expect(
      validatePlanSuggestionProviderOutput({
        ...validOutput,
        description: "每天完成固定任务。",
        rationale: "摘要显示学习很多。",
        suggestedActions: [
          {
            description: "每天整理任务。",
            linkedTags: ["study"],
            suggestedDueInDays: 2,
            title: "整理任务",
          },
        ],
        title: "学习计划",
      }),
    ).toMatchObject({
      success: false,
      reasonCodes: ["unsafe_missing_low_risk_language"],
    });
  });
});
