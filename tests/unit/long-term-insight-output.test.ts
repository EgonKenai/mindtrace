import { describe, expect, it } from "vitest";

import {
  longTermInsightGentleSuggestionSchema,
  longTermInsightPatternSchema,
  providerLongTermInsightOutputSchema,
} from "@/lib/validation/long-term-insights";
import { validateLongTermInsightProviderOutput } from "@/server/ai/long-term-insight-output-validation";

const validOutput = {
  gentleSuggestions: [
    {
      description: "如果你愿意，可以考虑先做一个低风险的小观察。",
      riskLevel: "low",
      suggestedActionType: "reflection",
      title: "可以考虑一次温和观察",
    },
  ],
  overview: "看起来这段摘要可能适合做一个低风险回顾。",
  patterns: [
    {
      confidence: "low",
      description: "可能有一些学习和睡眠相关的线索。",
      relatedTags: ["study"],
      title: "可能的节奏线索",
    },
  ],
  planSuggestionRefs: [],
  strengths: ["也许持续记录本身就是一个可以保留的部分。"],
  title: "可以考虑的洞察草稿",
  watchPoints: ["可以考虑继续观察缺失日期较多时的变化。"],
};

describe("long-term insight output validation", () => {
  it("validates the provider output schema", () => {
    expect(
      providerLongTermInsightOutputSchema.parse(validOutput),
    ).toMatchObject({
      title: "可以考虑的洞察草稿",
    });
  });

  it("validates pattern and gentle suggestion schemas", () => {
    expect(
      longTermInsightPatternSchema.parse(validOutput.patterns[0]),
    ).toMatchObject({ confidence: "low" });
    expect(
      longTermInsightGentleSuggestionSchema.parse(
        validOutput.gentleSuggestions[0],
      ),
    ).toMatchObject({ riskLevel: "low" });
  });

  it("rejects missing fields and unknown fields", () => {
    expect(
      validateLongTermInsightProviderOutput({
        ...validOutput,
        extra: "not allowed",
      }),
    ).toMatchObject({
      reason: "invalid",
      success: false,
    });
    expect(
      validateLongTermInsightProviderOutput({
        ...validOutput,
        patterns: [],
      }),
    ).toMatchObject({
      reason: "invalid",
      success: false,
    });
    const missingCoreField: Partial<typeof validOutput> = { ...validOutput };
    delete missingCoreField.overview;

    expect(
      validateLongTermInsightProviderOutput(missingCoreField),
    ).toMatchObject({
      reason: "invalid",
      reasonCodes: ["schema_validation_failed"],
      success: false,
    });
  });

  it("normalizes lightly missing non-core arrays without inventing core insight text", () => {
    const output: Partial<typeof validOutput> = { ...validOutput };
    delete output.planSuggestionRefs;
    delete output.strengths;
    delete output.watchPoints;

    expect(validateLongTermInsightProviderOutput(output)).toMatchObject({
      output: {
        planSuggestionRefs: [],
        strengths: [],
        watchPoints: [],
      },
      success: true,
    });
  });

  it("rejects diagnosis, medication, treatment promises, absolute language, and HTML", () => {
    for (const overview of [
      "你患有抑郁症。",
      "你需要调整药物。",
      "保证一定会治愈。",
      "你一定必须这样做。",
      "<script>alert(1)</script>",
    ]) {
      expect(
        validateLongTermInsightProviderOutput({
          ...validOutput,
          overview,
        }),
      ).toMatchObject({
        reason: "unsafe",
        success: false,
      });
    }
  });

  it("rejects output missing uncertainty language", () => {
    expect(
      validateLongTermInsightProviderOutput({
        ...validOutput,
        gentleSuggestions: [
          {
            description: "每天记录十分钟并整理计划。",
            riskLevel: "low",
            suggestedActionType: "planning",
            title: "记录计划",
          },
        ],
        overview: "这段摘要适合回顾。",
        patterns: [
          {
            confidence: "low",
            description: "学习和睡眠标签较多。",
            relatedTags: ["study"],
            title: "学习睡眠",
          },
        ],
        strengths: ["持续记录。"],
        title: "洞察草稿",
        watchPoints: ["观察睡眠。"],
      }),
    ).toMatchObject({
      reason: "unsafe",
      success: false,
    });
  });
});
