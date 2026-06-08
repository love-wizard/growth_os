import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  createAcceptedFamilyMember,
  createFamily,
  getAcceptedFamilyMembership
} from "@/lib/repositories/family-repo";
import { createChildInterests, createChildProfile } from "@/lib/repositories/child-repo";
import { createAnnualGoals } from "@/lib/repositories/goals-repo";
import { createInitialGrowthSystem } from "@/lib/services/growth-system-service";
import type { OnboardingRequest } from "@/lib/validation/schemas";

export async function completeOnboarding(
  supabase: SupabaseClient,
  user: User,
  input: OnboardingRequest
) {
  const existingMembership = await getAcceptedFamilyMembership(supabase, user.id);

  if (existingMembership) {
    throw new Error("User already belongs to a family workspace");
  }

  const familyId = await createFamily(supabase, {
    name: `${input.childProfile.nickname}的家庭`,
    createdByUserId: user.id
  });

  await createAcceptedFamilyMember(supabase, {
    familyId,
    userId: user.id,
    role: "father"
  });

  const childId = await createChildProfile(supabase, {
    familyId,
    childProfile: input.childProfile
  });

  await createChildInterests(supabase, {
    childId,
    interests: input.interests
  });
  await createAnnualGoals(supabase, {
    childId,
    annualGoals: input.annualGoals
  });
  const growthSystem = await createInitialGrowthSystem(supabase, {
    childId,
    childProfile: input.childProfile,
    annualGoals: input.annualGoals
  });

  return {
    familyId,
    childId,
    ...growthSystem
  };
}
