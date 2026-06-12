import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GrowthRecordDraftSourceType,
  GrowthRecordDraftStatus,
  GrowthRecordMediaType,
  UUID
} from "@/lib/domain/types";

export interface GrowthRecordInput {
  childId: UUID;
  childIds?: UUID[];
  happenedOn: string;
  happenedAt?: string;
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
      happened_at: input.happenedAt ?? null,
      text: input.text,
      tags: input.tags ?? [],
      parent_notes: input.parentNotes ?? null,
      draft_source_type: input.draftSourceType ?? null,
      draft_source_id: input.draftSourceId ?? null,
      draft_status: input.draftStatus ?? "saved",
      created_by_user_id: input.createdByUserId
    })
    .select("id,happened_on,happened_at,text,tags,parent_notes,draft_status")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertGrowthRecordChildren(
  supabase: SupabaseClient,
  input: { growthRecordId: UUID; childIds: UUID[] }
) {
  const uniqueChildIds = [...new Set(input.childIds)];
  if (!uniqueChildIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("growth_record_children")
    .upsert(
      uniqueChildIds.map((childId) => ({
        growth_record_id: input.growthRecordId,
        child_id: childId
      })),
      { onConflict: "growth_record_id,child_id" }
    )
    .select("growth_record_id,child_id");

  if (error) {
    throw error;
  }

  return data ?? [];
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
    .select("id,storage_path,media_type,file_name,mime_type,size_bytes")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export interface GrowthRecordMedia {
  id: UUID;
  storage_path: string;
  media_type: GrowthRecordMediaType;
  file_name: string;
  mime_type: string;
  size_bytes: number;
}

export async function getGrowthRecordForFamily(
  supabase: SupabaseClient,
  input: { familyId: UUID; recordId: UUID }
) {
  const { data, error } = await supabase
    .from("growth_records")
    .select(
      "id,child_id,happened_on,happened_at,text,tags,parent_notes,draft_status,deleted_at,restore_until,growth_record_media(id,storage_path,media_type,file_name,mime_type,size_bytes),child_profiles!growth_records_child_id_fkey!inner(family_id)"
    )
    .eq("id", input.recordId)
    .eq("child_profiles.family_id", input.familyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as GrowthRecord | null;
}

export async function getGrowthRecordForSharePreview(
  supabase: SupabaseClient,
  recordId: UUID
) {
  const { data, error } = await supabase
    .from("growth_records")
    .select(
      "id,child_id,happened_on,happened_at,text,tags,parent_notes,draft_status,deleted_at,restore_until,growth_record_media(id,storage_path,media_type,file_name,mime_type,size_bytes),child_profiles!growth_records_child_id_fkey!inner(nickname,families!inner(name))"
    )
    .eq("id", recordId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as (GrowthRecord & {
    child_profiles?: {
      nickname?: string;
      families?: { name?: string } | { name?: string }[];
    };
  }) | null;
}

export async function listRecentGrowthRecords(
  supabase: SupabaseClient,
  input: { familyId: UUID; childId?: UUID; scope?: "child" | "family" },
  limit = 20
) {
  const { data, error } = await supabase
    .from("growth_records")
    .select(
      "id,child_id,happened_on,happened_at,text,tags,parent_notes,draft_status,created_at,growth_record_media(id,storage_path,media_type,file_name,mime_type,size_bytes),growth_record_children(child_id,child_profiles!growth_record_children_child_id_fkey(nickname)),child_profiles!growth_records_child_id_fkey!inner(family_id)"
    )
    .eq("child_profiles.family_id", input.familyId)
    .is("deleted_at", null)
    .order("happened_at", { ascending: false, nullsFirst: false })
    .order("happened_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(input.scope === "family" ? limit : Math.max(limit * 3, 60));

  if (error) {
    throw error;
  }

  const records = data ?? [];
  if (input.scope === "family" || !input.childId) {
    return records.slice(0, limit);
  }

  return records
    .filter((record) => {
      const childLinks =
        "growth_record_children" in record && Array.isArray(record.growth_record_children)
          ? record.growth_record_children
          : [];
      return (
        record.child_id === input.childId ||
        childLinks.some((link: { child_id?: string }) => link.child_id === input.childId)
      );
    })
    .slice(0, limit);
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
  happened_at?: string | null;
  created_at?: string;
  text: string;
  tags: string[];
  parent_notes: string | null;
  draft_status: GrowthRecordDraftStatus | null;
  deleted_at: string | null;
  restore_until: string | null;
  growth_record_media?: GrowthRecordMedia[];
  growth_record_children?: Array<{
    child_id: UUID;
    child_profiles?: { nickname?: string } | { nickname?: string }[];
  }>;
}
