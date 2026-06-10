import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import {
  GrowthRecordError,
  attachGrowthRecordPhotoForFamily
} from "@/lib/services/growth-record-service";
import { invalidateFamilyReadCaches } from "@/lib/services/response-cache";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

const maxUploadBytes = 10 * 1024 * 1024;

export async function POST(
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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Photo file is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only photo upload is supported right now" }, { status: 400 });
    }

    if (file.size > maxUploadBytes) {
      return NextResponse.json({ error: "Photo must be 10MB or smaller" }, { status: 400 });
    }

    const { recordId } = await params;
    const serviceRoleSupabase = createServiceRoleSupabaseClient();
    const media = await attachGrowthRecordPhotoForFamily(
      supabase,
      serviceRoleSupabase,
      {
        familyId: membership.family_id,
        recordId,
        file
      }
    );

    invalidateFamilyReadCaches(membership.family_id);
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof GrowthRecordError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("Unable to upload growth record media", error);
    return NextResponse.json({ error: "Unable to upload growth record media" }, { status: 400 });
  }
}
