import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import type { AnnualGoalInput, ChildProfileInput } from "@/lib/validation/schemas";

export async function createInitialGrowthSystem(
  supabase: SupabaseClient,
  input: {
    childId: UUID;
    childProfile: ChildProfileInput;
    annualGoals: AnnualGoalInput[];
    referenceDate?: Date;
  }
) {
  const referenceDate = input.referenceDate ?? new Date();
  const weekStart = startOfWeek(referenceDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  const theme = input.annualGoals[0]?.title ?? "建立稳定陪伴节奏";

  await createMonthlyTheme(supabase, input.childId, referenceDate, theme);
  const weeklyPlanId = await createWeeklyPlan(supabase, {
    childId: input.childId,
    weekStart,
    weekEnd,
    theme
  });
  await createDefaultWeeklyTasks(supabase, weeklyPlanId);

  return {
    weeklyPlanId,
    theme
  };
}

async function createMonthlyTheme(
  supabase: SupabaseClient,
  childId: UUID,
  date: Date,
  title: string
) {
  const { error } = await supabase.from("monthly_themes").insert({
    child_id: childId,
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    title,
    summary: "围绕年度目标建立一个轻量、可持续的家庭陪伴节奏。"
  });

  if (error) {
    throw error;
  }
}

async function createWeeklyPlan(
  supabase: SupabaseClient,
  input: { childId: UUID; weekStart: Date; weekEnd: Date; theme: string }
) {
  const { data, error } = await supabase
    .from("weekly_plans")
    .insert({
      child_id: input.childId,
      week_start_date: input.weekStart.toISOString().slice(0, 10),
      week_end_date: input.weekEnd.toISOString().slice(0, 10),
      theme: input.theme,
      source: "initial",
      status: "active",
      reading_recommendation: "每天10分钟亲子共读，优先选择孩子愿意重复读的书。",
      english_recommendation: "每天5分钟英文儿歌或绘本音频，保持轻松输入。",
      weekend_activity: "选择一个不需要额外采购材料的户外观察活动。"
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as UUID;
}

async function createDefaultWeeklyTasks(supabase: SupabaseClient, weeklyPlanId: UUID) {
  const { error } = await supabase.from("weekly_tasks").insert([
    {
      weekly_plan_id: weeklyPlanId,
      assignee_type: "father",
      title: "一次户外运动或探索",
      planned_count: 1
    },
    {
      weekly_plan_id: weeklyPlanId,
      assignee_type: "mother",
      title: "三次亲子阅读",
      planned_count: 3
    },
    {
      weekly_plan_id: weeklyPlanId,
      assignee_type: "family",
      title: "一次轻松家庭复盘",
      planned_count: 1
    }
  ]);

  if (error) {
    throw error;
  }
}

function startOfWeek(date: Date) {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = result.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setUTCDate(result.getUTCDate() + diff);
  return result;
}
