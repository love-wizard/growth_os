import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { getChildIdFromRequestUrl } from "@/lib/services/active-child-service";
import {
  generateOrGetMonthlyReport,
  GrowthReportError
} from "@/lib/services/growth-report-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { growthReportMonthlyRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const body = growthReportMonthlyRequestSchema.parse(await request.json());
    const report = await generateOrGetMonthlyReport(supabase, {
      familyId: membership.family_id,
      userId: user.id,
      userRole: membership.role,
      scope: body.scope,
      childId: body.childId ?? getChildIdFromRequestUrl(request.url),
      periodStart: body.periodStart,
      periodEnd: body.periodEnd
    });

    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof GrowthReportError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("Unable to generate monthly report", error);
    return NextResponse.json({ error: "Unable to generate monthly report" }, { status: 400 });
  }
}
