import {
  providerLongTermInsightOutputSchema,
  type ProviderLongTermInsightOutput,
} from "@/lib/validation/long-term-insights";

export type LongTermInsightOutputValidationReasonCode =
  | "forbidden_diagnosis_language"
  | "forbidden_medication_advice"
  | "forbidden_treatment_promise"
  | "schema_validation_failed"
  | "unsafe_absolute_language"
  | "unsafe_crisis_promise"
  | "unsafe_executable_content"
  | "unsafe_missing_uncertainty_language";

interface ForbiddenPattern {
  code: LongTermInsightOutputValidationReasonCode;
  pattern: RegExp;
}

const forbiddenPatterns: ForbiddenPattern[] = [
  {
    code: "forbidden_diagnosis_language",
    pattern: /(抑郁症|焦虑症|双相|创伤后应激|PTSD|ADHD|强迫症)/iu,
  },
  {
    code: "forbidden_medication_advice",
    pattern:
      /((开始|停止|停用|增加|减少|调整).{0,12}(药|剂量|处方))|((服用|吃|使用).{0,12}(药|药片|处方药|镇静剂))/u,
  },
  {
    code: "forbidden_treatment_promise",
    pattern: /(保证|一定|肯定).{0,12}(治愈|康复|有效|好起来)/u,
  },
  {
    code: "unsafe_absolute_language",
    pattern: /(你一定|你肯定|必须|绝对|唯一办法|you must|definitely)/iu,
  },
  {
    code: "unsafe_crisis_promise",
    pattern: /(我会|系统会|MindTrace 会).{0,12}(联系|报警|通知|干预|救援)/iu,
  },
  {
    code: "unsafe_executable_content",
    pattern: /<[^>]+>|javascript:|data:text\/html/iu,
  },
];

const uncertaintyLanguagePattern =
  /(可能|看起来|也许|可以考虑|如果你愿意|不一定|may|might|could|consider)/iu;

function uniqueReasonCodes(
  codes: LongTermInsightOutputValidationReasonCode[],
): LongTermInsightOutputValidationReasonCode[] {
  return [...new Set(codes)];
}

function getCombinedText(output: ProviderLongTermInsightOutput): string {
  return [
    output.title,
    output.overview,
    ...output.patterns.flatMap((pattern) => [
      pattern.title,
      pattern.description,
    ]),
    ...output.strengths,
    ...output.watchPoints,
    ...output.gentleSuggestions.flatMap((suggestion) => [
      suggestion.title,
      suggestion.description,
    ]),
  ].join("\n");
}

export type LongTermInsightOutputValidationResult =
  | { output: ProviderLongTermInsightOutput; success: true }
  | {
      reason: "invalid" | "unsafe";
      reasonCodes: LongTermInsightOutputValidationReasonCode[];
      success: false;
    };

export function validateLongTermInsightProviderOutput(
  rawOutput: unknown,
): LongTermInsightOutputValidationResult {
  const parsed = providerLongTermInsightOutputSchema.safeParse(rawOutput);

  if (!parsed.success) {
    return {
      reason: "invalid",
      reasonCodes: ["schema_validation_failed"],
      success: false,
    };
  }

  const combinedText = getCombinedText(parsed.data);
  const reasonCodes = forbiddenPatterns
    .filter(({ pattern }) => pattern.test(combinedText))
    .map(({ code }) => code);

  if (!uncertaintyLanguagePattern.test(combinedText)) {
    reasonCodes.push("unsafe_missing_uncertainty_language");
  }

  if (reasonCodes.length > 0) {
    return {
      reason: "unsafe",
      reasonCodes: uniqueReasonCodes(reasonCodes),
      success: false,
    };
  }

  return { output: parsed.data, success: true };
}
