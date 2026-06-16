import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import {
  deleteGrowthRecordForFamily,
  GrowthRecordError,
  updateGrowthRecordForFamily
} from "@/lib/services/growth-record-service";
import { invalidateFamilyReadCaches } from "@/lib/services/response-cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { growthRecordUpdateSchema } from "@/lib/validation/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ recordId: string }> }
) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const { recordId } = await params;
    const body = growthRecordUpdateSchema.parse(await request.json());
    const record = await updateGrowthRecordForFamily(supabase, {
      familyId: membership.family_id,
      recordId,
      record: body
    });

    invalidateFamilyReadCaches(membership.family_id);
    return NextResponse.json({ record });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof GrowthRecordError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to update growth record" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ recordId: string }> }
) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const { recordId } = await params;
    await deleteGrowthRecordForFamily(supabase, {
      familyId: membership.family_id,
      recordId
    });
    invalidateFamilyReadCaches(membership.family_id);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof GrowthRecordError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to delete growth record" }, { status: 400 });
  }
}
