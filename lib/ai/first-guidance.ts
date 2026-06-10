import { z } from "zod";
import {
  firstGuidanceRequestSchema,
  firstGuidanceTodaySuggestionSchema,
  type FirstGuidanceRequest
} from "@/lib/validation/schemas";

export type FirstGuidanceSuggestion = z.infer<
  typeof firstGuidanceTodaySuggestionSchema
>;

const challengeCopy: Record<FirstGuidanceRequest["currentChallenge"], string> = {
  interest_resistance: "兴趣练习出现阻力",
  reading_difficulty: "阅读不容易坚持",
  unclear_english_exposure: "英语启蒙方向不清晰",
  limited_time_tonight: "今晚时间有限",
  weekend_activity_need: "需要一个周末活动",
  emotional_sensitivity: "最近情绪比较敏感",
  decreased_physical_activity: "最近身体活动减少",
  recent_growth_review: "想了解最近成长"
};

const traitCopy: Record<string, string> = {
  active: "精力充沛",
  sensitive: "感受细腻",
  slow_to_warm_up: "慢热",
  likes_praise: "喜欢被肯定",
  likes_competition: "喜欢挑战",
  strong_willed: "有主见",
  easily_frustrated: "遇到困难容易受挫",
  curious: "好奇",
  prefers_routines: "喜欢稳定节奏"
};

export function buildFirstGuidancePrompt(input: FirstGuidanceRequest) {
  const parsed = firstGuidanceRequestSchema.parse(input);
  const childAge = calculateAge(parsed.childBirthDate);

  return [
    "你是成长 OS 的 AI 家庭成长教练，不是通用聊天机器人。",
    `孩子昵称：${parsed.childNickname}`,
    `孩子年龄：${childAge} 岁`,
    `关注方向：${parsed.focusDirections.join(", ")}`,
    `当前挑战：${challengeCopy[parsed.currentChallenge]}`,
    `孩子特质：${parsed.childTraits.map((trait) => traitCopy[trait] ?? trait).join(", ")}`,
    "请输出一个今天可以执行的亲子陪伴建议，避免说教、避免制造焦虑。"
  ].join("\n");
}

export function generateFallbackFirstGuidanceSuggestion(
  input: FirstGuidanceRequest
): FirstGuidanceSuggestion {
  const parsed = firstGuidanceRequestSchema.parse(input);
  const childAge = calculateAge(parsed.childBirthDate);
  const primaryTrait = traitCopy[parsed.childTraits[0]] ?? parsed.childTraits[0];
  const challenge = challengeCopy[parsed.currentChallenge];
  const focus = parsed.focusDirections[0].replaceAll("_", " ");

  return {
    title: "今晚的15分钟陪伴实验",
    childSpecificContext: `${parsed.childNickname} 现在约 ${childAge} 岁，当前重点是 ${focus}，最近的挑战是${challenge}，并且孩子表现出${primaryTrait}的特质。`,
    likelyInterpretation:
      "这更像是需要降低阻力、重新建立轻松体验，而不是马上增加任务量。",
    action:
      "今晚只做一个15分钟的小行动：先让孩子选择开始方式，父母陪在旁边完成一小段，然后用一句具体观察收尾，例如“我看到你刚才坚持了最后两分钟”。",
    estimatedMinutes: 15,
    whyItHelps:
      "短行动能降低冲突，也能让父母把注意力放回陪伴质量，而不是完成度。",
    gentleFallback:
      "如果孩子仍然抗拒，就把目标降到3分钟，只保留一个轻松开始的动作。"
  };
}

export function calculateAge(birthDate: string, referenceDate = new Date()) {
  const birth = new Date(`${birthDate}T00:00:00.000Z`);
  let age = referenceDate.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = referenceDate.getUTCMonth() - birth.getUTCMonth();
  const dayDiff = referenceDate.getUTCDate() - birth.getUTCDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return Math.max(age, 0);
}
