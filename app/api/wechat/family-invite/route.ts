import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { createWeChatFamilyInvite } from "@/lib/services/invite-service";
import { recordWeChatChannelEntry } from "@/lib/services/wechat-channel-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { wechatFamilyInviteRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const body = wechatFamilyInviteRequestSchema.parse(await request.json());
    const inviteId = await createWeChatFamilyInvite(supabase, {
      familyId: membership.family_id,
      invitedByUserId: user.id,
      role: body.role
    });
    const attributionId = await recordWeChatChannelEntry(supabase, {
      familyId: membership.family_id,
      userId: user.id,
      entryType: "family_invite_card",
      sourceContext: {
        inviteId,
        role: body.role
      }
    });

    return NextResponse.json({
      inviteId,
      attributionId,
      sharePath: `/pages/invite/index?inviteId=${inviteId}`
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to create WeChat family invite" }, { status: 400 });
  }
}
