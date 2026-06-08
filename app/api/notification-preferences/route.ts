import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import {
  ReminderPreferenceError,
  updateWarmReminderPreference
} from "@/lib/services/reminder-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notificationPreferenceRequestSchema } from "@/lib/validation/schemas";

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const preference = notificationPreferenceRequestSchema.parse(await request.json());
    const saved = await updateWarmReminderPreference(supabase, {
      familyId: membership.family_id,
      userId: user.id,
      preference
    });

    return NextResponse.json({ preference: saved });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof ReminderPreferenceError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json({ error: "Unable to update notification preference" }, { status: 400 });
  }
}
