import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { getChildIdFromRequestUrl } from "@/lib/services/active-child-service";
import { getDashboardData } from "@/lib/services/dashboard-service";
import { elapsedMs, logPerf, nowMs } from "@/lib/services/perf-log";
import {
  familyDashboardCacheKey,
  getCachedResponse,
  setCachedResponse
} from "@/lib/services/response-cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const dashboardCacheTtlMs = 30 * 1000;

export async function GET(request: Request) {
  const startedAt = nowMs();
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const childId = getChildIdFromRequestUrl(request.url);
    const cacheKey = familyDashboardCacheKey(membership.family_id, childId);
    const cachedDashboard = getCachedResponse(cacheKey);
    if (cachedDashboard) {
      logPerf("api.dashboard", {
        totalMs: elapsedMs(startedAt),
        cache: "hit",
        familyId: membership.family_id
      });
      return NextResponse.json(cachedDashboard);
    }

    const loadStartedAt = nowMs();
    const dashboard = await getDashboardData(supabase, membership.family_id, { childId });
    setCachedResponse(cacheKey, dashboard, dashboardCacheTtlMs);
    logPerf("api.dashboard", {
      totalMs: elapsedMs(startedAt),
      dataMs: elapsedMs(loadStartedAt),
      cache: "miss",
      familyId: membership.family_id,
      taskCount: dashboard.todayTasks.length
    });
    return NextResponse.json(dashboard);
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    console.error("Unable to load dashboard", error);
    return NextResponse.json({ error: "Unable to load dashboard" }, { status: 500 });
  }
}
