import { NextResponse, type NextRequest } from "next/server";
import { recordWeChatChannelEntry } from "@/lib/services/wechat-channel-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { wechatScenarioEntryRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = wechatScenarioEntryRequestSchema.parse(await request.json());
  const attributionId = await recordWeChatChannelEntry(supabase, {
    entryType: "scenario_card",
    sourceContext: {
      scenarioType: body.scenarioType,
      ...body.sourceContext
    }
  });

  return NextResponse.json({
    attributionId,
    nextPath: `/onboarding?scenario=${body.scenarioType}`
  });
}
