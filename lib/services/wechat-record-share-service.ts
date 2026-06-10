import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { recordWeChatMetricEvent } from "@/lib/metrics/wechat-events";
import { getFamilyName } from "@/lib/repositories/family-repo";
import { getGrowthRecordForFamily } from "@/lib/repositories/growth-record-repo";
import { createGrowthMediaSignedReadUrl } from "@/lib/services/storage-service";
import { getCurrentWeeklyPlanForFamily } from "@/lib/services/weekly-plan-service";

export async function createWeChatRecordSharePreview(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; recordId: UUID }
) {
  const record = await getGrowthRecordForFamily(supabase, {
    familyId: input.familyId,
    recordId: input.recordId
  });

  if (!record || record.deleted_at) {
    throw new Error("Growth record was not found");
  }

  await recordWeChatMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: "wechat_record_card_shared",
    eventProperties: {
      recordId: input.recordId
    }
  });

  const photoUrls = await Promise.all(
    (record.growth_record_media ?? [])
      .filter((media) => media.media_type === "photo")
      .map(async (media) => {
        const signed = await createGrowthMediaSignedReadUrl(supabase, media.storage_path);
        return signed.signedUrl;
      })
  );
  const [familyName, weeklyPlan] = await Promise.all([
    getFamilyName(supabase, input.familyId),
    getCurrentWeeklyPlanForFamily(supabase, input.familyId)
  ]);
  const growthFocus = deriveGrowthFocus(record.tags, record.text);

  return buildPrivacySafeRecordPreview({
    happenedOn: record.happened_on,
    text: record.text,
    tags: record.tags,
    photoUrls,
    familyName,
    weeklyTheme: weeklyPlan?.theme ?? "",
    growthFocus,
    coachNote: buildCoachNote({
      growthFocus,
      tags: record.tags,
      text: record.text
    })
  });
}

export function buildPrivacySafeRecordPreview(input: {
  happenedOn: string;
  text: string;
  tags?: string[];
  photoUrls?: string[];
  familyName?: string;
  weeklyTheme?: string;
  growthFocus?: string;
  coachNote?: string;
}) {
  return {
    happenedOn: input.happenedOn,
    text: input.text.slice(0, 80),
    tags: input.tags ?? [],
    photoUrls: input.photoUrls ?? [],
    familyName: input.familyName ?? "",
    weeklyTheme: input.weeklyTheme ?? "",
    growthFocus: input.growthFocus ?? "",
    coachNote: input.coachNote ?? ""
  };
}

function deriveGrowthFocus(tags: string[] | undefined, text: string) {
  const keywords = [text, ...(tags ?? [])].join(" ").toLowerCase();

  if (hasKeyword(keywords, ["阅读", "绘本", "book", "read"])) {
    return "阅读习惯";
  }

  if (hasKeyword(keywords, ["钢琴", "练琴", "piano"])) {
    return "钢琴兴趣";
  }

  if (hasKeyword(keywords, ["英语", "english"])) {
    return "英语启蒙";
  }

  if (hasKeyword(keywords, ["游泳", "足球", "篮球", "运动", "swim", "soccer", "basketball"])) {
    return "身体发展";
  }

  if (hasKeyword(keywords, ["表达", "情绪", "聊天", "分享"])) {
    return "表达与情绪";
  }

  const firstTag = (tags ?? []).find(Boolean);
  return firstTag ? `围绕${firstTag}的小进步` : "日常陪伴";
}

function buildCoachNote(input: { growthFocus: string; tags: string[] | undefined; text: string }) {
  const keywords = [input.text, ...(input.tags ?? [])].join(" ").toLowerCase();

  if (input.text.includes("第一次")) {
    return "这是新的成长信号。先接住这份主动性，今晚只花10分钟和孩子聊聊当时为什么愿意去做。";
  }

  if (hasKeyword(keywords, ["阅读", "绘本", "book", "read"])) {
    return "这是阅读主动性在冒头。顺着孩子刚刚感兴趣的内容，再共读10分钟就够了。";
  }

  if (hasKeyword(keywords, ["钢琴", "练琴", "piano"])) {
    return "这是兴趣开始转成自驱的信号。先肯定这次投入，再留一个轻松收尾，不急着纠正细节。";
  }

  if (hasKeyword(keywords, ["英语", "english"])) {
    return "别把它变成上课。今晚只用5分钟复现一个单词或句子，让孩子觉得英语能用起来。";
  }

  if (hasKeyword(keywords, ["游泳", "足球", "篮球", "运动", "swim", "soccer", "basketball"])) {
    return "这是身体自信在累积。接下来保持短频快的练习节奏，比一次做很久更有效。";
  }

  if (hasKeyword(keywords, ["表达", "情绪", "聊天", "分享"])) {
    return "这是表达欲被看见的时刻。别急着评价，多追问一句“你当时怎么想的？”。";
  }

  return `这是一条值得被记住的${input.growthFocus}信号。今晚花10分钟重提这件小事，陪孩子把感受说出来。`;
}

function hasKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}
