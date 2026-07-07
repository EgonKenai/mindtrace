import { describe, expect, it } from "vitest";

import {
  planSuggestionRequestSchema,
  providerPlanSuggestionOutputSchema,
} from "@/lib/validation/plan-suggestions";
import { validatePlanSuggestionProviderOutput } from "@/server/ai/plan-suggestion-output-validation";

const englishOutput = {
  description:
    "You could consider starting with a small study and rest rhythm draft.",
  linkedTags: ["study", "sleep"],
  rationale:
    "The aggregate summary may show study and sleep as common recent themes.",
  suggestedActions: [
    {
      description:
        "If you want, you could set aside ten minutes before bed to organize one small task for tomorrow.",
      linkedTags: ["study"],
      suggestedDueInDays: 2,
      title: "Consider a gentle study wrap-up",
    },
  ],
  title: "Consider a study and rest draft",
};

const chineseOutput = {
  description:
    "\u53ef\u4ee5\u8003\u8651\u4ece\u4e00\u4e2a\u8f83\u5c0f\u7684\u5b66\u4e60\u548c\u7761\u7720\u8282\u594f\u5f00\u59cb\u89c2\u5bdf\u3002",
  linkedTags: ["study", "sleep"],
  rationale:
    "\u770b\u8d77\u6765\u5b66\u4e60\u548c\u7761\u7720\u662f\u6700\u8fd1\u6458\u8981\u91cc\u7684\u5e38\u89c1\u4e3b\u9898\u3002",
  suggestedActions: [
    {
      description:
        "\u5982\u679c\u4f60\u613f\u610f\uff0c\u53ef\u4ee5\u5728\u7761\u524d\u7559\u51fa\u5341\u5206\u949f\u6574\u7406\u660e\u5929\u4efb\u52a1\u3002",
      linkedTags: ["study"],
      suggestedDueInDays: 2,
      title: "\u5b89\u6392\u6e29\u548c\u7684\u5b66\u4e60\u6536\u5c3e",
    },
  ],
  title: "\u53ef\u4ee5\u8003\u8651\u7684\u5b66\u4e60\u4f11\u606f\u8349\u7a3f",
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
    expect(
      providerPlanSuggestionOutputSchema.parse(englishOutput),
    ).toMatchObject({
      title: englishOutput.title,
    });

    expect(() =>
      providerPlanSuggestionOutputSchema.parse({
        ...englishOutput,
        suggestedActions: [
          {
            ...englishOutput.suggestedActions[0],
            linkedTags: ["study", "study"],
          },
        ],
      }),
    ).toThrow();
  });

  it("accepts low-risk draft language for English and Chinese locales", () => {
    expect(validatePlanSuggestionProviderOutput(englishOutput, "en")).toEqual({
      output: englishOutput,
      success: true,
    });
    expect(
      validatePlanSuggestionProviderOutput(chineseOutput, "zh-CN"),
    ).toEqual({
      output: chineseOutput,
      success: true,
    });
  });

  it("rejects obvious Chinese user-facing fields for English plan suggestions", () => {
    const result = validatePlanSuggestionProviderOutput(chineseOutput, "en");

    expect(result).toMatchObject({
      success: false,
      reason: "unsafe",
      reasonCodes: expect.arrayContaining(["language_mismatch"]),
    });
  });

  it.each([
    [
      {
        ...chineseOutput,
        rationale: "\u4f60\u4e00\u5b9a\u60a3\u6709\u6291\u90c1\u75c7\u3002",
      },
      "forbidden_diagnosis_language",
    ],
    [
      {
        ...chineseOutput,
        description:
          "\u4f60\u5fc5\u987b\u505c\u6b62\u670d\u7528\u836f\u7269\u3002",
      },
      "forbidden_medication_advice",
    ],
    [
      { ...chineseOutput, title: "\u4fdd\u8bc1\u6709\u6548\u7684\u8ba1\u5212" },
      "forbidden_treatment_promise",
    ],
    [
      {
        ...chineseOutput,
        description:
          "\u552f\u4e00\u529e\u6cd5\u662f\u6bcf\u5929\u5b8c\u6210\u5168\u90e8\u4efb\u52a1\u3002",
      },
      "unsafe_absolute_language",
    ],
    [
      { ...chineseOutput, rationale: "<script>alert('x')</script>" },
      "unsafe_executable_content",
    ],
  ])("rejects unsafe provider output %#", (output, reasonCode) => {
    const result = validatePlanSuggestionProviderOutput(output, "zh-CN");

    expect(result).toMatchObject({
      success: false,
      reason: "unsafe",
      reasonCodes: expect.arrayContaining([reasonCode]),
    });
  });

  it("rejects missing fields and output without low-risk language", () => {
    expect(
      validatePlanSuggestionProviderOutput("not-json", "en"),
    ).toMatchObject({
      success: false,
      reasonCodes: ["schema_validation_failed"],
    });
    expect(
      validatePlanSuggestionProviderOutput(
        {
          ...englishOutput,
          description: "Finish the same task every day.",
          rationale: "The summary shows many study entries.",
          suggestedActions: [
            {
              description: "Organize tasks every day.",
              linkedTags: ["study"],
              suggestedDueInDays: 2,
              title: "Organize tasks",
            },
          ],
          title: "Study plan",
        },
        "en",
      ),
    ).toMatchObject({
      success: false,
      reasonCodes: ["unsafe_missing_low_risk_language"],
    });
  });
});
