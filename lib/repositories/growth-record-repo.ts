import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GrowthRecordDraftSourceType,
  GrowthRecordDraftStatus,
  GrowthRecordMediaType,
  UUID
} from "@/lib/domain/types";

export interface GrowthRecordInput {
  childId: UUID;
  happenedOn: string;
  text: string;
  tags?: string[];
  parentNotes?: string;
  createdByUserId: UUID;
  draftSourceType?: GrowthRecordDraftSourceType;
  draftSourceId?: UUID;
  draftStatus?: GrowthRecordDraftStatus;
}

export async function createGrowthRecord(
  supabase: SupabaseClient,
  input: GrowthRecordInput
) {
  const { data, error } = await supabase
    .from("growth_records")
    .insert({
      child_id: input.childId,
      happened_on: input.happenedOn,
      text: input.text,
      tags: input.tags ?? [],
      parent_notes: input.parentNotes ?? null,
      draft_source_type: input.draftSourceType ?? null,
      draft_source_id: input.draftSourceId ?? null,
      draft_status: input.draftStatus ?? "saved",
      created_by_user_id: input.createdByUserId
    })
    .select("id,happened_on,text,tags,parent_notes,draft_status")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createGrowthRecordMedia(
  supabase: SupabaseClient,
  input: {
    growthRecordId: UUID;
    storagePath: string;
    mediaType: GrowthRecordMediaType;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }
) {
  const { data, error } = await supabase
    .from("growth_record_media")
    .insert({
      growth_record_id: input.growthRecordId,
      storage_path: input.storagePath,
      media_type: input.mediaType,
      file_name: input.fileName,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes
    })
    .select("id,storage_path,media_type,file_name")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getGrowthRecordForFamily(
  supabase: SupabaseClient,
  input: { familyId: UUID; recordId: UUID }
) {
  const { data, error } = await supabase
    .from("growth_records")
    .select(
      "id,child_id,happened_on,text,tags,parent_notes,draft_status,deleted_at,restore_until,child_profiles!inner(family_id)"
    )
    .eq("id", input.recordId)
    .eq("child_profiles.family_id", input.familyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as GrowthRecord | null;
}

export async function listRecentGrowthRecords(supabase: SupabaseClient, childId: UUID) {
  const { data, error } = await supabase
    .from("growth_records")
    .select("id,happened_on,text,tags,parent_notes,draft_status")
    .eq("child_id", childId)
    .is("deleted_at", null)
    .order("happened_on", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function softDeleteGrowthRecord(
  supabase: SupabaseClient,
  input: { recordId: UUID; deletedAt: string; restoreUntil: string }
) {
  const { error } = await supabase
    .from("growth_records")
    .update({
      deleted_at: input.deletedAt,
      restore_until: input.restoreUntil
    })
    .eq("id", input.recordId);

  if (error) {
    throw error;
  }
}

export async function restoreGrowthRecord(supabase: SupabaseClient, recordId: UUID) {
  const { error } = await supabase
    .from("growth_records")
    .update({
      deleted_at: null,
      restore_until: null
    })
    .eq("id", recordId);

  if (error) {
    throw error;
  }
}

export interface GrowthRecord {
  id: UUID;
  child_id: UUID;
  happened_on: string;
  text: string;
  tags: string[];
  parent_notes: string | null;
  draft_status: GrowthRecordDraftStatus | null;
  deleted_at: string | null;
  restore_until: string | null;
}
