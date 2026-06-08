import { NextResponse, type NextRequest } from "next/server";
import { bindWeChatIdentity } from "@/lib/auth/wechat-auth";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { wechatIdentityBindingRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const body = wechatIdentityBindingRequestSchema.parse(await request.json());
    const binding = await bindWeChatIdentity(supabase, {
      userId: user.id,
      code: body.code
    });

    return NextResponse.json({ binding });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to bind WeChat identity" }, { status: 400 });
  }
}
