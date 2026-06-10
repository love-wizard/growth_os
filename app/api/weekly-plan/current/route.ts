import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { getCurrentWeeklyPlanForFamily } from "@/lib/services/weekly-plan-service";
import { elapsedMs, logPerf, nowMs } from "@/lib/services/perf-log";
import {
  familyWeeklyPlanCacheKey,
  getCachedResponse,
  setCachedResponse
} from "@/lib/services/response-cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const weeklyPlanCacheTtlMs = 30 * 1000;

export async function GET() {
  const startedAt = nowMs();
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const cacheKey = familyWeeklyPlanCacheKey(membership.family_id);
    const cachedWeeklyPlan = getCachedResponse(cacheKey);
    if (cachedWeeklyPlan) {
      logPerf("api.weekly-plan.current", {
        totalMs: elapsedMs(startedAt),
        cache: "hit",
        familyId: membership.family_id
      });
      return NextResponse.json({ weeklyPlan: cachedWeeklyPlan });
    }

    const loadStartedAt = nowMs();
    const weeklyPlan = await getCurrentWeeklyPlanForFamily(supabase, membership.family_id);
    setCachedResponse(cacheKey, weeklyPlan, weeklyPlanCacheTtlMs);
    logPerf("api.weekly-plan.current", {
      totalMs: elapsedMs(startedAt),
      dataMs: elapsedMs(loadStartedAt),
      cache: "miss",
      familyId: membership.family_id,
      taskCount: weeklyPlan?.weekly_tasks?.length ?? 0
    });
    return NextResponse.json({ weeklyPlan });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to load weekly plan" }, { status: 500 });
  }
}
