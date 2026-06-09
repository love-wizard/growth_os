import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { acceptFamilyInvite } from "@/lib/services/invite-service";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient
} from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params;
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const result = await acceptFamilyInvite(createServiceRoleSupabaseClient(), {
      inviteId,
      user
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("not available")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Unable to accept invitation without creating duplicates" },
      { status: 409 }
    );
  }
}
