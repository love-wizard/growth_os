import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { ParentProfileError, saveParentAvatarForFamily } from "@/lib/services/parent-profile-service";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const serviceRoleSupabase = createServiceRoleSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const displayName = String(formData.get("displayName") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Avatar file is required" }, { status: 400 });
    }

    const profile = await saveParentAvatarForFamily(
      supabase,
      serviceRoleSupabase,
      {
        familyId: membership.family_id,
        userId: user.id,
        displayName,
        role: membership.role,
        file
      }
    );

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof ParentProfileError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("Unable to upload parent avatar", error);
    return NextResponse.json({ error: "Unable to upload parent avatar" }, { status: 400 });
  }
}
