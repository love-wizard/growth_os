import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { getChildIdFromRequestUrl } from "@/lib/services/active-child-service";
import { listGrowthReports } from "@/lib/services/growth-report-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") === "family" ? "family" : "child";
    const rawReportType = url.searchParams.get("reportType");
    const reportType =
      rawReportType === "annual" || rawReportType === "monthly" ? rawReportType : undefined;
    const reports = await listGrowthReports(supabase, {
      familyId: membership.family_id,
      scope,
      childId: getChildIdFromRequestUrl(request.url),
      reportType
    });

    return NextResponse.json({ reports });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    console.error("Unable to load growth reports", error);
    return NextResponse.json({ error: "Unable to load growth reports" }, { status: 500 });
  }
}
