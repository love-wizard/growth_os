import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { buildDraftText } from "@/lib/services/growth-record-draft-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { growthRecordDraftRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const body = growthRecordDraftRequestSchema.parse(await request.json());
    const draft = {
      sourceType: body.sourceType,
      sourceId: body.sourceId,
      text: buildDraftText(body.sourceType, body.parentNote),
      parentNotes: body.parentNote ?? null,
      draftStatus: "local"
    };

    return NextResponse.json({ draft });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to create growth record draft" }, { status: 400 });
  }
}
