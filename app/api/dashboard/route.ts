import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { getDashboardData } from "@/lib/services/dashboard-service";
import {
  familyDashboardCacheKey,
  getCachedResponse,
  setCachedResponse
} from "@/lib/services/response-cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const dashboardCacheTtlMs = 30 * 1000;

export async function GET() {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const cacheKey = familyDashboardCacheKey(membership.family_id);
    const cachedDashboard = getCachedResponse(cacheKey);
    if (cachedDashboard) {
      return NextResponse.json(cachedDashboard);
    }

    const dashboard = await getDashboardData(supabase, membership.family_id);
    setCachedResponse(cacheKey, dashboard, dashboardCacheTtlMs);
    return NextResponse.json(dashboard);
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    console.error("Unable to load dashboard", error);
    return NextResponse.json({ error: "Unable to load dashboard" }, { status: 500 });
  }
}
