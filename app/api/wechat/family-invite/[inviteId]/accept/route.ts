import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { recordWeChatMetricEvent } from "@/lib/metrics/wechat-events";
import { acceptFamilyInvite } from "@/lib/services/invite-service";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient
} from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const { inviteId } = await params;
    const membership = await acceptFamilyInvite(createServiceRoleSupabaseClient(), {
      inviteId,
      user
    });

    await recordWeChatMetricEvent(supabase, {
      familyId: membership.familyId,
      userId: user.id,
      eventName: "wechat_family_invite_accepted",
      eventProperties: {
        inviteId
      }
    });

    return NextResponse.json({ membership });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to accept WeChat family invite" }, { status: 400 });
  }
}
