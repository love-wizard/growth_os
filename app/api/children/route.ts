import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { listFamilyChildren, createChildInterests, createChildProfile } from "@/lib/repositories/child-repo";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { createAnnualGoals } from "@/lib/repositories/goals-repo";
import { createInitialGrowthSystem } from "@/lib/services/growth-system-service";
import { invalidateFamilyReadCaches } from "@/lib/services/response-cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { onboardingRequestSchema } from "@/lib/validation/schemas";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const children = await listFamilyChildren(supabase, membership.family_id);
    return NextResponse.json({ children });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to load children" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const body = onboardingRequestSchema.parse(await request.json());
    const childId = await createChildProfile(supabase, {
      familyId: membership.family_id,
      childProfile: body.childProfile
    });

    await createChildInterests(supabase, {
      childId,
      interests: body.interests
    });
    await createAnnualGoals(supabase, {
      childId,
      annualGoals: body.annualGoals
    });
    const growthSystem = await createInitialGrowthSystem(supabase, {
      childId,
      childProfile: body.childProfile,
      annualGoals: body.annualGoals
    });

    invalidateFamilyReadCaches(membership.family_id);
    return NextResponse.json({ childId, ...growthSystem }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to create child profile" }, { status: 400 });
  }
}
