import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import {
  GrowthRecordError,
  saveGrowthRecord
} from "@/lib/services/growth-record-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { growthRecordInputSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const body = growthRecordInputSchema.parse(await request.json());
    const record = await saveGrowthRecord(supabase, {
      familyId: membership.family_id,
      userId: user.id,
      record: body
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof GrowthRecordError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json({ error: "Unable to create growth record" }, { status: 400 });
  }
}
