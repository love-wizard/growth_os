import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { getChildIdFromRequestUrl } from "@/lib/services/active-child-service";
import {
  InterestParticipationError,
  listInterestParticipationSnapshot,
  recordInterestParticipation
} from "@/lib/services/interest-participation-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { interestParticipationRecordInputSchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const url = new URL(request.url);
    const snapshot = await listInterestParticipationSnapshot(supabase, {
      familyId: membership.family_id,
      childId: getChildIdFromRequestUrl(request.url),
      scope: url.searchParams.get("scope") === "family" ? "family" : "child"
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Unable to load interest participation records" },
      { status: 400 }
    );
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

    const record = interestParticipationRecordInputSchema.parse(await request.json());
    const created = await recordInterestParticipation(supabase, {
      familyId: membership.family_id,
      childId: getChildIdFromRequestUrl(request.url),
      record
    });

    return NextResponse.json({ record: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof InterestParticipationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json({ error: "Unable to record interest participation" }, { status: 400 });
  }
}
