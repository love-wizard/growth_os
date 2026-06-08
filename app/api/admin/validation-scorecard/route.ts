import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { generateInvestmentValidationScorecard } from "@/lib/metrics/scorecard-report";
import { getActiveInternalReviewer } from "@/lib/repositories/expert-review-repo";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const reviewer = await getActiveInternalReviewer(supabase, user.id);

    if (!reviewer) {
      return NextResponse.json({ error: "Active internal reviewer is required" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("product_metric_events")
      .select("event_name,user_id,family_id")
      .order("occurred_at", { ascending: false })
      .limit(1000);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      scorecard: generateInvestmentValidationScorecard(data ?? [])
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to export validation scorecard" }, { status: 400 });
  }
}
