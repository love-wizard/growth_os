import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { updateWeChatSubscriptionPreference } from "@/lib/services/wechat-subscription-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { wechatSubscriptionPreferenceRequestSchema } from "@/lib/validation/schemas";

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const body = wechatSubscriptionPreferenceRequestSchema.parse(await request.json());
    const preference = await updateWeChatSubscriptionPreference(supabase, {
      familyId: membership.family_id,
      userId: user.id,
      reminderType: body.reminderType,
      enabled: body.enabled,
      templateId: body.templateId
    });

    return NextResponse.json({ preference });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to update WeChat subscription" }, { status: 400 });
  }
}
