import type { SupabaseClient } from "@supabase/supabase-js";
import type { GrowthRecordMediaType, UUID } from "@/lib/domain/types";

export const growthRecordBucket = "growth-media";

export function buildGrowthMediaStoragePath(input: {
  familyId: UUID;
  childId: UUID;
  recordId: UUID;
  fileName: string;
}) {
  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${input.familyId}/${input.childId}/${input.recordId}/${safeFileName}`;
}

export function inferGrowthMediaType(mimeType: string): GrowthRecordMediaType {
  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "photo";
}

export async function createGrowthMediaUploadUrl(
  supabase: SupabaseClient,
  storagePath: string
) {
  const { data, error } = await supabase.storage
    .from(growthRecordBucket)
    .createSignedUploadUrl(storagePath);

  if (error) {
    throw error;
  }

  return data;
}

export async function createGrowthMediaSignedReadUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 3600
) {
  const { data, error } = await supabase.storage
    .from(growthRecordBucket)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    throw error;
  }

  return data;
}
