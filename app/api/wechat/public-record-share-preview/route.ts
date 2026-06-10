import { NextResponse, type NextRequest } from "next/server";
import { createPublicWeChatRecordSharePreview } from "@/lib/services/wechat-record-share-service";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { wechatRecordSharePreviewRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleSupabaseClient();

  try {
    const body = wechatRecordSharePreviewRequestSchema.parse(await request.json());
    const preview = await createPublicWeChatRecordSharePreview(supabase, {
      recordId: body.recordId
    });

    return NextResponse.json({ preview });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Growth record was not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to create public record share preview" }, { status: 400 });
  }
}
