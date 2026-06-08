import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { recordCompanionshipActionCompleted } from "@/lib/metrics/weekly-plan-events";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import {
  updateWeeklyTaskProgressForFamily,
  WeeklyPlanNotFoundError,
  WeeklyTaskProgressError
} from "@/lib/services/weekly-plan-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateTaskProgressRequestSchema } from "@/lib/validation/schemas";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const { taskId } = await params;
    const body = updateTaskProgressRequestSchema.parse(await request.json());
    const result = await updateWeeklyTaskProgressForFamily(supabase, {
      familyId: membership.family_id,
      taskId,
      completedCount: body.completedCount
    });

    if (result.completedCountIncreased) {
      await recordCompanionshipActionCompleted(supabase, {
        familyId: membership.family_id,
        userId: user.id,
        weeklyPlanId: result.task.weekly_plan_id,
        taskId: result.task.id,
        completedCount: result.task.completed_count,
        plannedCount: result.task.planned_count
      });
    }

    return NextResponse.json({ task: result.task });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof WeeklyPlanNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof WeeklyTaskProgressError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json({ error: "Unable to update weekly task" }, { status: 400 });
  }
}
