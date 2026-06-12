import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { getChildIdFromRequestUrl } from "@/lib/services/active-child-service";
import { askAICoach } from "@/lib/services/ai-coach-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { aiCoachRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const body = aiCoachRequestSchema.parse(await request.json());
    const scope = new URL(request.url).searchParams.get("scope") === "family" ? "family" : "child";
    const result = await askAICoach(supabase, {
      familyId: membership.family_id,
      userId: user.id,
      userRole: membership.role,
      mode: body.mode,
      message: body.message,
      childId: getChildIdFromRequestUrl(request.url),
      scope
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to ask AI coach" }, { status: 400 });
  }
}
