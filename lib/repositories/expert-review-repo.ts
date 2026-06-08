import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExpertReviewStatus, UUID } from "@/lib/domain/types";

export async function getActiveInternalReviewer(
  supabase: SupabaseClient,
  userId: UUID
) {
  const { data, error } = await supabase
    .from("internal_reviewers")
    .select("id,reviewer_type,status")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as { id: UUID; reviewer_type: string; status: string } | null;
}

export async function createExpertQualityReview(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    conversationId: UUID;
    reviewerId: UUID;
    reviewStatus: ExpertReviewStatus;
    qualityScores: Record<string, number>;
    safetyBoundaryPassed: boolean;
    reviewNotes?: string;
  }
) {
  const { data, error } = await supabase
    .from("expert_quality_reviews")
    .insert({
      family_id: input.familyId,
      conversation_id: input.conversationId,
      reviewer_id: input.reviewerId,
      review_status: input.reviewStatus,
      quality_scores: input.qualityScores,
      safety_boundary_passed: input.safetyBoundaryPassed,
      review_notes: input.reviewNotes ?? null
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as UUID;
}
