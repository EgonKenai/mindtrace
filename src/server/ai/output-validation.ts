import {
  providerOutputSchema,
  type ValidatedProviderOutput,
} from "@/lib/validation/ai-feedback";

export type ProviderOutputValidationReasonCode =
  | "forbidden_causal_claim"
  | "forbidden_diagnosis_language"
  | "forbidden_medication_advice"
  | "forbidden_treatment_promise"
  | "missing_uncertainty_language"
  | "raw_output_repetition"
  | "schema_validation_failed"
  | "unsafe_absolute_language"
  | "unsafe_crisis_delay_language"
  | "unsafe_dependency_language"
  | "unsafe_executable_content"
  | "unsafe_unreviewed_contact_information";

interface ForbiddenPattern {
  code: ProviderOutputValidationReasonCode;
  pattern: RegExp;
}

const forbiddenPatterns: ForbiddenPattern[] = [
  {
    code: "forbidden_diagnosis_language",
    pattern:
      /(抑郁症|焦虑症|双相情感障碍|精神分裂症|创伤后应激障碍|PTSD|ADHD|强迫症)/iu,
  },
  {
    code: "forbidden_medication_advice",
    pattern:
      /((开始|停止|停用|增加|减少|调整|加大|减小).{0,10}(药|剂量|处方))|((服用|吃|使用).{0,10}(药|药片|处方药|镇静剂))/u,
  },
  {
    code: "unsafe_crisis_delay_language",
    pattern:
      /(等一等|稍后再说|先睡一觉).{0,12}(紧急|危险|自杀|伤害)|(紧急|危险|自杀|伤害).{0,12}(等一等|稍后再说|先睡一觉)/u,
  },
  {
    code: "forbidden_treatment_promise",
    pattern: /(保证|一定|肯定).{0,8}(治愈|康复|有效|好起来)/u,
  },
  {
    code: "unsafe_dependency_language",
    pattern:
      /(只有(?:我|这个应用|MindTrace).{0,8}(理解|懂))|不要告诉任何人|只需要依赖/iu,
  },
  {
    code: "unsafe_absolute_language",
    pattern: /(你一定|你肯定|必然|绝对)/u,
  },
  {
    code: "forbidden_causal_claim",
    pattern: /(导致|造成|证明了).{0,12}(情绪|压力|焦虑|抑郁|失眠|问题)/u,
  },
  {
    code: "unsafe_executable_content",
    pattern: /<[^>]+>|javascript:|data:text\/html/iu,
  },
  {
    code: "unsafe_unreviewed_contact_information",
    pattern: /(?:\+?\d[\d\s()-]{6,}\d)/u,
  },
];
const uncertaintyPattern = /(可能|也许|似乎|看起来|记录(?:中)?显示|从记录看)/u;

function normalizeForComparison(value: string): string {
  return value.normalize("NFKC").replace(/\s+/gu, "");
}

function repeatsSensitiveSource(output: string, note: string): boolean {
  const normalizedOutput = normalizeForComparison(output);
  const normalizedNote = normalizeForComparison(note);
  const windowSize = 24;

  if (normalizedNote.length < windowSize) {
    return false;
  }

  for (let index = 0; index <= normalizedNote.length - windowSize; index += 8) {
    if (
      normalizedOutput.includes(normalizedNote.slice(index, index + windowSize))
    ) {
      return true;
    }
  }

  return false;
}

function uniqueReasonCodes(
  codes: ProviderOutputValidationReasonCode[],
): ProviderOutputValidationReasonCode[] {
  return [...new Set(codes)];
}

function getUnsafeReasonCodes(
  combinedOutput: string,
  reflection: string,
  sourceNote: string,
): ProviderOutputValidationReasonCode[] {
  const reasonCodes = forbiddenPatterns
    .filter(({ pattern }) => pattern.test(combinedOutput))
    .map(({ code }) => code);

  if (!uncertaintyPattern.test(reflection)) {
    reasonCodes.push("missing_uncertainty_language");
  }

  if (repeatsSensitiveSource(combinedOutput, sourceNote)) {
    reasonCodes.push("raw_output_repetition");
  }

  return uniqueReasonCodes(reasonCodes);
}

export type ProviderOutputValidationResult =
  | { success: true; output: ValidatedProviderOutput }
  | {
      success: false;
      reason: "invalid" | "unsafe";
      reasonCodes: ProviderOutputValidationReasonCode[];
    };

export function validateProviderOutput(
  rawOutput: unknown,
  sourceNote: string,
): ProviderOutputValidationResult {
  const parsed = providerOutputSchema.safeParse(rawOutput);

  if (!parsed.success) {
    return {
      success: false,
      reason: "invalid",
      reasonCodes: ["schema_validation_failed"],
    };
  }

  const combined = [parsed.data.reflection, ...parsed.data.suggestions].join(
    "\n",
  );
  const reasonCodes = getUnsafeReasonCodes(
    combined,
    parsed.data.reflection,
    sourceNote,
  );

  if (reasonCodes.length > 0) {
    return { success: false, reason: "unsafe", reasonCodes };
  }

  return { success: true, output: parsed.data };
}
