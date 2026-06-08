import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParticipationOutcome, UUID } from "@/lib/domain/types";

export interface InterestParticipationRecordInput {
  childId: UUID;
  interestId: UUID;
  happenedOn: string;
  participationOutcome: ParticipationOutcome;
  durationMinutes?: number;
  count?: number;
  notes?: string;
}

export async function createInterestParticipationRecord(
  supabase: SupabaseClient,
  input: InterestParticipationRecordInput
) {
  const { data, error } = await supabase
    .from("interest_participation_records")
    .insert({
      child_id: input.childId,
      interest_id: input.interestId,
      happened_on: input.happenedOn,
      participation_outcome: input.participationOutcome,
      duration_minutes: input.durationMinutes ?? null,
      count: input.count ?? null,
      notes: input.notes ?? null
    })
    .select("id,happened_on,participation_outcome,duration_minutes,count,notes")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getInterestParticipationRecordForFamily(
  supabase: SupabaseClient,
  input: { familyId: UUID; recordId: UUID }
) {
  const { data, error } = await supabase
    .from("interest_participation_records")
    .select(
      "id,child_id,interest_id,happened_on,participation_outcome,duration_minutes,count,notes,deleted_at,restore_until,child_profiles!inner(family_id)"
    )
    .eq("id", input.recordId)
    .eq("child_profiles.family_id", input.familyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as InterestParticipationRecord | null;
}

export async function listRecentInterestParticipationRecords(
  supabase: SupabaseClient,
  childId: UUID
) {
  const { data, error } = await supabase
    .from("interest_participation_records")
    .select("id,happened_on,participation_outcome,duration_minutes,count,notes")
    .eq("child_id", childId)
    .is("deleted_at", null)
    .order("happened_on", { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function softDeleteInterestParticipationRecord(
  supabase: SupabaseClient,
  input: { recordId: UUID; deletedAt: string; restoreUntil: string }
) {
  const { error } = await supabase
    .from("interest_participation_records")
    .update({
      deleted_at: input.deletedAt,
      restore_until: input.restoreUntil
    })
    .eq("id", input.recordId);

  if (error) {
    throw error;
  }
}

export async function restoreInterestParticipationRecord(
  supabase: SupabaseClient,
  recordId: UUID
) {
  const { error } = await supabase
    .from("interest_participation_records")
    .update({
      deleted_at: null,
      restore_until: null
    })
    .eq("id", recordId);

  if (error) {
    throw error;
  }
}

export interface InterestParticipationRecord {
  id: UUID;
  child_id: UUID;
  interest_id: UUID | null;
  happened_on: string;
  participation_outcome: ParticipationOutcome;
  duration_minutes: number | null;
  count: number | null;
  notes: string | null;
  deleted_at: string | null;
  restore_until: string | null;
}
