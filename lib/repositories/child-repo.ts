import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import type { ChildProfileInput } from "@/lib/validation/schemas";

export async function createChildProfile(
  supabase: SupabaseClient,
  input: { familyId: UUID; childProfile: ChildProfileInput }
) {
  const { data, error } = await supabase
    .from("child_profiles")
    .insert({
      family_id: input.familyId,
      name: input.childProfile.name,
      nickname: input.childProfile.nickname,
      birth_date: input.childProfile.birthDate,
      gender: input.childProfile.gender
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as UUID;
}

export async function createChildInterests(
  supabase: SupabaseClient,
  input: { childId: UUID; interests: string[] }
) {
  const { error } = await supabase.from("child_interests").insert(
    input.interests.map((interest) => ({
      child_id: input.childId,
      name: interest,
      source: isPresetInterest(interest) ? "preset" : "custom"
    }))
  );

  if (error) {
    throw error;
  }
}

function isPresetInterest(interest: string) {
  return [
    "piano",
    "swimming",
    "football",
    "basketball",
    "reading",
    "drawing",
    "building_blocks",
    "english"
  ].includes(interest);
}
