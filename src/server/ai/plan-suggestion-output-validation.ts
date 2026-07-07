import {
  providerPlanSuggestionOutputSchema,
  type ProviderPlanSuggestionOutput,
} from "@/lib/validation/plan-suggestions";
import type { AppLocale } from "@/i18n/config";

export type PlanSuggestionOutputValidationReasonCode =
  | "forbidden_diagnosis_language"
  | "forbidden_medication_advice"
  | "forbidden_treatment_promise"
  | "language_mismatch"
  | "schema_validation_failed"
  | "unsafe_absolute_language"
  | "unsafe_crisis_promise"
  | "unsafe_executable_content"
  | "unsafe_missing_low_risk_language";

interface ForbiddenPattern {
  code: PlanSuggestionOutputValidationReasonCode;
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
    pattern: /(你一定|你肯定|必须|绝对|唯一办法)/u,
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

const lowRiskLanguagePattern =
  /(可以考虑|也许可以|如果你愿意|看起来|可能|不一定|could|might|may|consider)/iu;

function uniqueReasonCodes(
  codes: PlanSuggestionOutputValidationReasonCode[],
): PlanSuggestionOutputValidationReasonCode[] {
  return [...new Set(codes)];
}

function getCombinedText(output: ProviderPlanSuggestionOutput): string {
  return [
    output.title,
    output.description,
    output.rationale,
    ...output.suggestedActions.flatMap((action) => [
      action.title,
      action.description,
    ]),
  ].join("\n");
}

const obviousChineseCharacterPattern = /[\u3400-\u9fff]/u;

function hasLanguageMismatch(
  output: ProviderPlanSuggestionOutput,
  locale: AppLocale,
): boolean {
  if (locale !== "en") {
    return false;
  }

  return obviousChineseCharacterPattern.test(getCombinedText(output));
}

export type PlanSuggestionOutputValidationResult =
  | { output: ProviderPlanSuggestionOutput; success: true }
  | {
      reason: "invalid" | "unsafe";
      reasonCodes: PlanSuggestionOutputValidationReasonCode[];
      success: false;
    };

export function validatePlanSuggestionProviderOutput(
  rawOutput: unknown,
  locale: AppLocale,
): PlanSuggestionOutputValidationResult {
  const parsed = providerPlanSuggestionOutputSchema.safeParse(rawOutput);

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

  if (!lowRiskLanguagePattern.test(combinedText)) {
    reasonCodes.push("unsafe_missing_low_risk_language");
  }

  if (hasLanguageMismatch(parsed.data, locale)) {
    reasonCodes.push("language_mismatch");
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
