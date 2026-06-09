import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";

export async function getParentProfile(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID }
) {
  const { data, error } = await supabase
    .from("parent_profiles")
    .select("id,display_name,avatar_storage_path")
    .eq("family_id", input.familyId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertParentProfile(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    userId: UUID;
    displayName: string;
    avatarStoragePath?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("parent_profiles")
    .upsert(
      {
        family_id: input.familyId,
        user_id: input.userId,
        display_name: input.displayName,
        avatar_storage_path: input.avatarStoragePath ?? null
      },
      { onConflict: "family_id,user_id" }
    )
    .select("id,display_name,avatar_storage_path")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
