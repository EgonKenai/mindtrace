import type { FeedbackPolicyDecision } from "@/features/ai-feedback/model";
import type { FeedbackReasonCode } from "@/lib/validation/ai-feedback";

export interface FeedbackPolicyResult {
  decision: FeedbackPolicyDecision;
  reasonCodes: FeedbackReasonCode[];
}

const selfHarmTargets =
  /(自杀|结束(?:我)?的?生命|伤害我自己|不想活|kill myself|end my life|hurt myself)/iu;
const otherHarmTargets =
  /(杀(?:了|掉)?(?:他|她|人)|伤害(?:他人|别人|某人)|kill (?:him|her|them|someone)|hurt someone)/iu;
const acuteDangerTargets =
  /(正在被攻击|现在有生命危险|眼前有人持刀|煤气泄漏|in immediate danger|being attacked)/iu;
const intentSignals =
  /(?:我.{0,6})?(?:要|会|打算|准备|决定|控制不住想)|i.{0,12}(?:will|am going to|plan to|intend to)/iu;
const urgencySignals =
  /(现在|马上|立刻|今晚|今天|已经准备|就在眼前|now|tonight|immediately|today)/iu;
const planOrMeansSignals =
  /(计划|方法|工具|刀|枪|药物|绳|高处|地点|等他回来|plan|method|knife|gun|pills|rope|location)/iu;
const ambiguousDistressSignals =
  /(活不下去|撑不住|没有出路|希望一切消失|不想醒来|彻底绝望|can't go on|cannot go on|no way out|wish i would not wake up)/iu;
const intensitySignals =
  /(真的|完全|再也|快要|非常|已经|really|completely|anymore|already)/iu;
const historicalOrQuotedContext =
  /(以前|过去|曾经|小说|电影|新闻|歌词|朋友说|他说|她说|used to|in a (?:novel|movie|news report)|my friend said|he said|she said)/iu;
const negatedIntent =
  /(?:(?:不(?:会|想|打算|准备|要)|没有|没想过|从未).{0,8}(?:自杀|结束(?:我)?的?生命|伤害我自己|杀人|伤害他人)|(?:do not|don't|am not going to|never).{0,20}(?:kill myself|end my life|hurt myself|kill someone))/iu;

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);

    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (Number.isNaN(next) || next < 0xdc00 || next > 0xdfff) {
        return true;
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }

  return false;
}

function activeClauses(note: string): string[] {
  return note
    .normalize("NFKC")
    .split(/[。！？!?\n；;]|(?:，|,)?(?:但是|但|不过|but|however)(?:，|,)?/iu)
    .map((clause) => clause.trim())
    .filter(Boolean)
    .filter(
      (clause) =>
        !negatedIntent.test(clause) && !historicalOrQuotedContext.test(clause),
    );
}

export function routeFeedbackSafety(note: string): FeedbackPolicyResult {
  if (hasUnpairedSurrogate(note)) {
    return {
      decision: "safe_fallback",
      reasonCodes: ["CLASSIFICATION_UNCERTAIN"],
    };
  }

  const clauses = activeClauses(note);

  for (const clause of clauses) {
    if (acuteDangerTargets.test(clause) && urgencySignals.test(clause)) {
      return {
        decision: "crisis_redirect",
        reasonCodes: ["ACUTE_DANGER"],
      };
    }

    const explicitIntent = intentSignals.test(clause);
    const immediateOrPlanned =
      urgencySignals.test(clause) || planOrMeansSignals.test(clause);

    if (selfHarmTargets.test(clause) && explicitIntent && immediateOrPlanned) {
      return {
        decision: "crisis_redirect",
        reasonCodes: ["EXPLICIT_IMMEDIATE_SELF_HARM"],
      };
    }

    if (otherHarmTargets.test(clause) && explicitIntent && immediateOrPlanned) {
      return {
        decision: "crisis_redirect",
        reasonCodes: ["EXPLICIT_IMMEDIATE_HARM_TO_OTHERS"],
      };
    }
  }

  const activeText = clauses.join("。");
  if (
    (ambiguousDistressSignals.test(activeText) &&
      intensitySignals.test(activeText)) ||
    ((selfHarmTargets.test(activeText) || otherHarmTargets.test(activeText)) &&
      intentSignals.test(activeText))
  ) {
    return {
      decision: "supportive_redirect",
      reasonCodes: ["AMBIGUOUS_HIGH_DISTRESS"],
    };
  }

  return {
    decision: "allow_generation",
    reasonCodes: ["NORMAL_JOURNAL_CONTENT"],
  };
}
