import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { completeOnboarding } from "@/lib/services/onboarding-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { onboardingRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = onboardingRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid onboarding request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const result = await completeOnboarding(supabase, user, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("already belongs")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to complete onboarding" }, { status: 500 });
  }
}
