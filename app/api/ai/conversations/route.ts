import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { listAIConversationsForFamily } from "@/lib/repositories/ai-repo";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const conversations = await listAIConversationsForFamily(supabase, {
      familyId: membership.family_id,
      limit: 8
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to load AI conversations" }, { status: 400 });
  }
}
