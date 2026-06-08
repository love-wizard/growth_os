import { NextResponse } from "next/server";
import {
  generateFallbackFirstGuidanceSuggestion,
  buildFirstGuidancePrompt
} from "@/lib/ai/first-guidance";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { recordFirstGuidanceGenerated } from "@/lib/metrics/first-guidance-events";
import { createFirstGuidanceSession } from "@/lib/repositories/first-guidance-repo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  firstGuidanceRequestSchema,
  firstGuidanceResponseSchema
} from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = firstGuidanceRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid first guidance request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const todaySuggestion = generateFallbackFirstGuidanceSuggestion(parsed.data);
    const sessionId = await createFirstGuidanceSession(supabase, {
      userId: user.id,
      request: parsed.data,
      todaySuggestion
    });

    await recordFirstGuidanceGenerated(supabase, {
      userId: user.id,
      sessionId
    });

    const response = firstGuidanceResponseSchema.parse({
      sessionId,
      todaySuggestion,
      promptPreview: buildFirstGuidancePrompt(parsed.data)
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Unable to generate first guidance" },
      { status: 500 }
    );
  }
}
