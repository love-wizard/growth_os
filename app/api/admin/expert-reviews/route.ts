import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import {
  createExpertReview,
  ExpertReviewAuthorizationError
} from "@/lib/services/expert-review-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { expertReviewRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const body = expertReviewRequestSchema
      .extend({ familyId: expertReviewRequestSchema.shape.conversationId })
      .parse(await request.json());
    const reviewId = await createExpertReview(supabase, {
      userId: user.id,
      familyId: body.familyId,
      review: body
    });

    return NextResponse.json({ reviewId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof ExpertReviewAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ error: "Unable to create expert review" }, { status: 400 });
  }
}
