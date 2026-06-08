import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { recordExpertReviewCompleted } from "@/lib/metrics/engagement-trust-events";
import {
  createExpertQualityReview,
  getActiveInternalReviewer
} from "@/lib/repositories/expert-review-repo";
import type { z } from "zod";
import { expertReviewRequestSchema } from "@/lib/validation/schemas";

export type ExpertReviewRequest = z.infer<typeof expertReviewRequestSchema>;

export class ExpertReviewAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpertReviewAuthorizationError";
  }
}

export async function createExpertReview(
  supabase: SupabaseClient,
  input: { userId: UUID; familyId: UUID; review: ExpertReviewRequest }
) {
  const reviewer = await getActiveInternalReviewer(supabase, input.userId);

  if (!reviewer) {
    throw new ExpertReviewAuthorizationError("Active internal reviewer is required");
  }

  const reviewId = await createExpertQualityReview(supabase, {
    familyId: input.familyId,
    conversationId: input.review.conversationId,
    reviewerId: reviewer.id,
    reviewStatus: input.review.reviewStatus,
    qualityScores: input.review.qualityScores,
    safetyBoundaryPassed: input.review.safetyBoundaryPassed,
    reviewNotes: input.review.reviewNotes
  });

  await recordExpertReviewCompleted(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    conversationId: input.review.conversationId,
    reviewId
  });

  return reviewId;
}
