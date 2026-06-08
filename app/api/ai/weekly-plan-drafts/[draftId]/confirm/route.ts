import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import {
  recordAICoachSuggestionAdopted
} from "@/lib/metrics/ai-coach-events";
import { recordWeeklyPlanConfirmed } from "@/lib/metrics/weekly-plan-events";
import {
  confirmAIWeeklyPlanDraft,
  getAIWeeklyPlanDraftForFamily
} from "@/lib/repositories/ai-repo";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const { draftId } = await params;
    const draft = await getAIWeeklyPlanDraftForFamily(supabase, {
      familyId: membership.family_id,
      draftId
    });

    if (!draft || draft.status !== "draft") {
      return NextResponse.json({ error: "Weekly plan draft was not found" }, { status: 404 });
    }

    const weeklyPlanId = await confirmAIWeeklyPlanDraft(supabase, {
      draft,
      userId: user.id
    });

    await recordWeeklyPlanConfirmed(supabase, {
      familyId: membership.family_id,
      userId: user.id,
      weeklyPlanId,
      source: "ai_confirmed"
    });
    if (draft.ai_conversation_id) {
      await recordAICoachSuggestionAdopted(supabase, {
        familyId: membership.family_id,
        userId: user.id,
        conversationId: draft.ai_conversation_id,
        mode: "weekly_plan_draft"
      });
    }

    return NextResponse.json({ weeklyPlanId });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to confirm weekly plan draft" }, { status: 400 });
  }
}
