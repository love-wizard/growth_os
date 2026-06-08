import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { ParentRole, UUID } from "@/lib/domain/types";
import { createAcceptedFamilyMember } from "@/lib/repositories/family-repo";

export async function createSecondParentInvite(
  supabase: SupabaseClient,
  input: { familyId: UUID; email: string; role: ParentRole; invitedByUserId: UUID }
) {
  const { data, error } = await supabase
    .from("family_invitations")
    .insert({
      family_id: input.familyId,
      email: input.email,
      role: input.role,
      invited_by_user_id: input.invitedByUserId
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as UUID;
}

export async function acceptFamilyInvite(
  supabase: SupabaseClient,
  input: { inviteId: UUID; user: User }
) {
  const { data: invitation, error } = await supabase
    .from("family_invitations")
    .select("family_id,role,status")
    .eq("id", input.inviteId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!invitation || invitation.status !== "pending") {
    throw new Error("Invitation is not available");
  }

  await createAcceptedFamilyMember(supabase, {
    familyId: invitation.family_id as UUID,
    userId: input.user.id,
    role: invitation.role as ParentRole
  });

  const { error: updateError } = await supabase
    .from("family_invitations")
    .update({
      status: "accepted",
      accepted_by_user_id: input.user.id,
      accepted_at: new Date().toISOString()
    })
    .eq("id", input.inviteId);

  if (updateError) {
    throw updateError;
  }

  return {
    familyId: invitation.family_id as UUID,
    role: invitation.role as ParentRole
  };
}
