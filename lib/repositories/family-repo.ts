import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParentRole, UUID } from "@/lib/domain/types";
import { elapsedMs, logPerf, nowMs } from "@/lib/services/perf-log";

type AcceptedFamilyMembership = {
  family_id: string;
  role: string;
};

type CachedMembership = {
  expiresAt: number;
  membership: AcceptedFamilyMembership;
};

const acceptedMembershipCache = new Map<string, CachedMembership>();
const acceptedMembershipCacheTtlMs = 5 * 60 * 1000;

function getCachedAcceptedMembership(userId: UUID) {
  const cached = acceptedMembershipCache.get(userId);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    acceptedMembershipCache.delete(userId);
    return null;
  }

  return cached.membership;
}

function setCachedAcceptedMembership(userId: UUID, membership: AcceptedFamilyMembership) {
  acceptedMembershipCache.set(userId, {
    expiresAt: Date.now() + acceptedMembershipCacheTtlMs,
    membership
  });
}

export async function getAcceptedFamilyMembership(
  supabase: SupabaseClient,
  userId: UUID
) {
  const startedAt = nowMs();
  const cached = getCachedAcceptedMembership(userId);
  if (cached) {
    logPerf("repo.family-membership", {
      totalMs: elapsedMs(startedAt),
      cache: "hit",
      userId,
      familyId: cached.family_id
    });
    return cached;
  }

  const { data, error } = await supabase
    .from("family_members")
    .select("family_id,role")
    .eq("user_id", userId)
    .eq("invitation_status", "accepted")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    setCachedAcceptedMembership(userId, data);
  }

  logPerf("repo.family-membership", {
    totalMs: elapsedMs(startedAt),
    cache: "miss",
    userId,
    familyId: data?.family_id
  });

  return data;
}

export async function createFamily(
  supabase: SupabaseClient,
  input: { name: string; createdByUserId: UUID }
) {
  const { data, error } = await supabase
    .from("families")
    .insert({
      name: input.name,
      created_by_user_id: input.createdByUserId
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as UUID;
}

export async function createAcceptedFamilyMember(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; role: ParentRole; invitedByUserId?: UUID }
) {
  const { error } = await supabase.from("family_members").insert({
    family_id: input.familyId,
    user_id: input.userId,
    role: input.role,
    invitation_status: "accepted",
    invited_by_user_id: input.invitedByUserId ?? input.userId,
    invited_at: new Date().toISOString(),
    accepted_at: new Date().toISOString()
  });

  if (error) {
    throw error;
  }

  acceptedMembershipCache.delete(input.userId);
}

export async function getFamilyName(supabase: SupabaseClient, familyId: UUID) {
  const { data, error } = await supabase
    .from("families")
    .select("name")
    .eq("id", familyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.name ?? "";
}
