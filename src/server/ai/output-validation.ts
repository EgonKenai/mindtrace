import {
  providerOutputSchema,
  type ValidatedProviderOutput,
} from "@/lib/validation/ai-feedback";

const forbiddenPatterns = [
  /(抑郁症|焦虑症|双相情感障碍|精神分裂症|创伤后应激障碍)/u,
  /(开始|停止|停用|增加|减少|调整|加大|减小).{0,10}(药|剂量|处方)/u,
  /(服用|吃|使用).{0,10}(药|药片|处方药|镇静剂)/u,
  /(等一等|稍后再说|先睡一觉).{0,12}(紧急|危险|自杀|伤害)/u,
  /(紧急|危险|自杀|伤害).{0,12}(等一等|稍后再说|先睡一觉)/u,
  /(保证|一定|肯定).{0,8}(治愈|康复|有效|好起来)/u,
  /(只有(?:我|这个应用|MindTrace).{0,8}(理解|懂)|不要告诉任何人|只需要依赖)/iu,
  /(你一定|你肯定|必然会)/u,
  /(导致|造成|证明了).{0,12}(情绪|压力|焦虑|抑郁|失眠|问题)/u,
  /<[^>]+>|javascript:|data:text\/html/iu,
  /(?:\+?\d[\d\s()-]{6,}\d)/u,
];
const uncertaintyPattern = /(可能|也许|似乎|看起来|记录(?:中)?显示)/u;

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

export type ProviderOutputValidationResult =
  | { success: true; output: ValidatedProviderOutput }
  | { success: false; reason: "invalid" | "unsafe" };

export function validateProviderOutput(
  rawOutput: unknown,
  sourceNote: string,
): ProviderOutputValidationResult {
  const parsed = providerOutputSchema.safeParse(rawOutput);

  if (!parsed.success) {
    return { success: false, reason: "invalid" };
  }

  const combined = [parsed.data.reflection, ...parsed.data.suggestions].join(
    "\n",
  );

  if (
    forbiddenPatterns.some((pattern) => pattern.test(combined)) ||
    !uncertaintyPattern.test(parsed.data.reflection) ||
    repeatsSensitiveSource(combined, sourceNote)
  ) {
    return { success: false, reason: "unsafe" };
  }

  return { success: true, output: parsed.data };
}
