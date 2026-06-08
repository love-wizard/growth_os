import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { createWeChatRecordSharePreview } from "@/lib/services/wechat-record-share-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { wechatRecordSharePreviewRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const body = wechatRecordSharePreviewRequestSchema.parse(await request.json());
    const preview = await createWeChatRecordSharePreview(supabase, {
      familyId: membership.family_id,
      userId: user.id,
      recordId: body.recordId
    });

    return NextResponse.json({ preview });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to create record share preview" }, { status: 400 });
  }
}
