import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { recordAISuggestionAdopted } from "@/lib/metrics/first-guidance-events";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { acceptTodaySuggestion } from "@/lib/services/suggestion-service";
import {
  FamilyWorkspaceRequiredError,
  FirstGuidanceSessionNotFoundError
} from "@/lib/services/suggestion-service";
import { invalidateFamilyReadCaches } from "@/lib/services/response-cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { acceptSuggestionRequestSchema } from "@/lib/validation/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = acceptSuggestionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid suggestion acceptance request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);
    const result = await acceptTodaySuggestion(supabase, {
      sessionId,
      userId: user.id,
      familyId: membership?.family_id,
      ...parsed.data
    });

    if (result.addedToWeeklyPlan && membership) {
      invalidateFamilyReadCaches(membership.family_id);
    }

    await recordAISuggestionAdopted(supabase, {
      userId: user.id,
      familyId: membership?.family_id ?? null,
      sessionId,
      actionType: result.addedToWeeklyPlan ? "add_to_weekly_plan" : "accept_only",
      weeklyTaskId: result.weeklyTaskId ?? undefined,
      assigneeType: parsed.data.taskAssigneeType,
      entrySurface: parsed.data.entrySurface
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof FirstGuidanceSessionNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof FamilyWorkspaceRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to accept suggestion" }, { status: 500 });
  }
}
