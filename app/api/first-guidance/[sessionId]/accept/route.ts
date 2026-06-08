import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { recordAISuggestionAdopted } from "@/lib/metrics/first-guidance-events";
import { acceptTodaySuggestion } from "@/lib/services/suggestion-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { acceptSuggestionRequestSchema } from "@/lib/validation/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = acceptSuggestionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid suggestion acceptance request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const result = await acceptTodaySuggestion(supabase, {
      sessionId,
      ...parsed.data
    });

    await recordAISuggestionAdopted(supabase, {
      userId: user.id,
      sessionId
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to accept suggestion" }, { status: 500 });
  }
}
