import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { recordWeChatChannelEntry } from "@/lib/services/wechat-channel-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { wechatFamilyInviteRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const body = wechatFamilyInviteRequestSchema.parse(await request.json());
    const attributionId = await recordWeChatChannelEntry(supabase, {
      familyId: body.familyId,
      userId: user.id,
      entryType: "family_invite_card",
      sourceContext: {
        role: body.role
      }
    });

    return NextResponse.json({
      attributionId,
      sharePath: `/invite?familyId=${body.familyId}&role=${body.role}`
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to create WeChat family invite" }, { status: 400 });
  }
}
