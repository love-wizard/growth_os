import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import {
  getGrowthReportDetail,
  GrowthReportError
} from "@/lib/services/growth-report-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const { reportId } = await params;
    const report = await getGrowthReportDetail(supabase, {
      familyId: membership.family_id,
      reportId
    });

    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof GrowthReportError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Unable to load growth report", error);
    return NextResponse.json({ error: "Unable to load growth report" }, { status: 500 });
  }
}
