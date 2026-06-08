import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import {
  InterestParticipationError,
  recordInterestParticipation
} from "@/lib/services/interest-participation-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { interestParticipationRecordInputSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const record = interestParticipationRecordInputSchema.parse(await request.json());
    const created = await recordInterestParticipation(supabase, {
      familyId: membership.family_id,
      record
    });

    return NextResponse.json({ record: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof InterestParticipationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json({ error: "Unable to record interest participation" }, { status: 400 });
  }
}
