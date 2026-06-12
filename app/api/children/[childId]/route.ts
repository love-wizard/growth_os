import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import {
  archiveFamilyChildProfile,
  listFamilyChildren,
  updateFamilyChildProfile
} from "@/lib/repositories/child-repo";
import { invalidateFamilyReadCaches } from "@/lib/services/response-cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { childProfileUpdateSchema } from "@/lib/validation/schemas";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const { childId } = await params;
    const body = childProfileUpdateSchema.parse(await request.json());
    const child = await updateFamilyChildProfile(supabase, {
      familyId: membership.family_id,
      childId,
      childProfile: body
    });

    if (!child) {
      return NextResponse.json({ error: "Child profile not found" }, { status: 404 });
    }

    invalidateFamilyReadCaches(membership.family_id);
    return NextResponse.json({ child });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to update child profile" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const activeChildren = await listFamilyChildren(supabase, membership.family_id);
    if (activeChildren.length <= 1) {
      return NextResponse.json({ error: "At least one active child profile is required" }, { status: 422 });
    }

    const { childId } = await params;
    const child = await archiveFamilyChildProfile(supabase, {
      familyId: membership.family_id,
      childId
    });

    if (!child) {
      return NextResponse.json({ error: "Child profile not found" }, { status: 404 });
    }

    invalidateFamilyReadCaches(membership.family_id);
    return NextResponse.json({ archived: true, child });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to archive child profile" }, { status: 400 });
  }
}
