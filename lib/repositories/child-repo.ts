import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import type { ChildProfileInput } from "@/lib/validation/schemas";

export interface ChildProfileRecord {
  id: UUID;
  family_id: UUID;
  name: string;
  nickname: string;
  birth_date: string;
  gender: string;
  profile_color?: string;
  created_at: string;
}

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

export async function listFamilyChildren(supabase: SupabaseClient, familyId: UUID) {
  const { data, error } = await supabase
    .from("child_profiles")
    .select("id,family_id,name,nickname,birth_date,gender,profile_color,created_at")
    .eq("family_id", familyId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ChildProfileRecord[];
}

export async function getFamilyChild(
  supabase: SupabaseClient,
  input: { familyId: UUID; childId: UUID }
) {
  const { data, error } = await supabase
    .from("child_profiles")
    .select("id,family_id,name,nickname,birth_date,gender,profile_color,created_at")
    .eq("family_id", input.familyId)
    .eq("id", input.childId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ChildProfileRecord | null;
}

export async function updateFamilyChildProfile(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    childId: UUID;
    childProfile: {
      name?: string;
      nickname?: string;
      birthDate?: string;
      gender?: string;
      profileColor?: string;
    };
  }
) {
  const updates: Record<string, string> = {};
  if (input.childProfile.name) {
    updates.name = input.childProfile.name;
  }
  if (input.childProfile.nickname) {
    updates.nickname = input.childProfile.nickname;
  }
  if (input.childProfile.birthDate) {
    updates.birth_date = input.childProfile.birthDate;
  }
  if (input.childProfile.gender) {
    updates.gender = input.childProfile.gender;
  }
  if (input.childProfile.profileColor) {
    updates.profile_color = input.childProfile.profileColor;
  }

  const { data, error } = await supabase
    .from("child_profiles")
    .update(updates)
    .eq("family_id", input.familyId)
    .eq("id", input.childId)
    .select("id,family_id,name,nickname,birth_date,gender,profile_color,created_at")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ChildProfileRecord | null;
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
