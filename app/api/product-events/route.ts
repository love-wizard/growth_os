import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { recordProductMetricEvent } from "@/lib/metrics/product-events";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { productMetricEventRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);
    const body = productMetricEventRequestSchema.parse(await request.json());

    await recordProductMetricEvent(supabase, {
      familyId: membership?.family_id ?? null,
      userId: user.id,
      eventName: body.eventName,
      eventProperties: body.eventProperties
    });

    return NextResponse.json({ recorded: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to record product event" }, { status: 400 });
  }
}
