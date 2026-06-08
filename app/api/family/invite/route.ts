import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { createSecondParentInvite } from "@/lib/services/invite-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { inviteParentRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = inviteParentRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid invite request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const inviteId = await createSecondParentInvite(supabase, {
      familyId: membership.family_id,
      invitedByUserId: user.id,
      ...parsed.data
    });

    return NextResponse.json({ inviteId });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to create invite" }, { status: 500 });
  }
}
