import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import {
  getParentProfileForFamily,
  saveParentDisplayNameForFamily
} from "@/lib/services/parent-profile-service";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { parentProfileRequestSchema } from "@/lib/validation/schemas";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const serviceRoleSupabase = createServiceRoleSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const profile = await getParentProfileForFamily(supabase, serviceRoleSupabase, {
      familyId: membership.family_id,
      userId: user.id,
      role: membership.role
    });

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to load parent profile" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const serviceRoleSupabase = createServiceRoleSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const body = parentProfileRequestSchema.parse(await request.json());
    await saveParentDisplayNameForFamily(supabase, {
      familyId: membership.family_id,
      userId: user.id,
      displayName: body.displayName,
      role: membership.role
    });

    const profile = await getParentProfileForFamily(supabase, serviceRoleSupabase, {
      familyId: membership.family_id,
      userId: user.id,
      role: membership.role
    });

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to save parent profile" }, { status: 400 });
  }
}
