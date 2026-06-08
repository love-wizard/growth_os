import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { recordProductMetricEvent } from "@/lib/metrics/product-events";

export function recordWeeklyPlanConfirmed(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; weeklyPlanId: UUID; source: string }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: "weekly_plan_confirmed",
    eventProperties: {
      weeklyPlanId: input.weeklyPlanId,
      source: input.source
    }
  });
}

export function recordCompanionshipActionCompleted(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    userId: UUID;
    weeklyPlanId: UUID;
    taskId: UUID;
    completedCount: number;
    plannedCount: number;
  }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: "companionship_action_completed",
    eventProperties: {
      weeklyPlanId: input.weeklyPlanId,
      taskId: input.taskId,
      completedCount: input.completedCount,
      plannedCount: input.plannedCount
    }
  });
}
