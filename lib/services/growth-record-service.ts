import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { recordGrowthRecordCreated } from "@/lib/metrics/growth-record-events";
import { getFamilyChildId } from "@/lib/repositories/weekly-plan-repo";
import {
  createGrowthRecord,
  createGrowthRecordMedia,
  getGrowthRecordForFamily,
  listRecentGrowthRecords,
  restoreGrowthRecord,
  softDeleteGrowthRecord
} from "@/lib/repositories/growth-record-repo";
import {
  buildGrowthMediaStoragePath,
  createGrowthMediaSignedReadUrl,
  growthRecordBucket
} from "@/lib/services/storage-service";
import { elapsedMs, logPerf, nowMs } from "@/lib/services/perf-log";
import type { z } from "zod";
import { growthRecordInputSchema } from "@/lib/validation/schemas";

export class GrowthRecordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GrowthRecordError";
  }
}

export type GrowthRecordRequest = z.infer<typeof growthRecordInputSchema>;

export async function listGrowthRecordsForFamily(
  supabase: SupabaseClient,
  storageSupabase: SupabaseClient,
  input: { familyId: UUID; limit?: number }
) {
  const startedAt = nowMs();
  const childStartedAt = nowMs();
  const childId = await getFamilyChildId(supabase, input.familyId);
  const childMs = elapsedMs(childStartedAt);

  if (!childId) {
    logPerf("service.growth-records.list", {
      totalMs: elapsedMs(startedAt),
      childMs,
      hasChild: false,
      familyId: input.familyId
    });
    return [];
  }

  const recordsStartedAt = nowMs();
  const records = await listRecentGrowthRecords(supabase, childId, input.limit ?? 20);
  const recordsMs = elapsedMs(recordsStartedAt);

  const signingStartedAt = nowMs();
  const recordsWithMedia = await Promise.all(
    records.map(async (record) => ({
      ...record,
      growth_record_media: await Promise.all(
        (record.growth_record_media ?? []).slice(0, 3).map(async (media) => {
          const signed = await createGrowthMediaSignedReadUrl(
            storageSupabase,
            media.storage_path
          );

          return {
            ...media,
            signed_url: signed.signedUrl
          };
        })
      )
    }))
  );
  const signingMs = elapsedMs(signingStartedAt);

  logPerf("service.growth-records.list", {
    totalMs: elapsedMs(startedAt),
    childMs,
    recordsMs,
    signingMs,
    hasChild: true,
    familyId: input.familyId,
    recordCount: records.length,
    mediaCount: recordsWithMedia.reduce(
      (count, record) => count + (record.growth_record_media?.length ?? 0),
      0
    )
  });

  return recordsWithMedia;
}

export async function saveGrowthRecord(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; record: GrowthRecordRequest }
) {
  const childId = await getFamilyChildId(supabase, input.familyId);

  if (!childId) {
    throw new GrowthRecordError("Child profile is required");
  }

  const record = await createGrowthRecord(supabase, {
    childId,
    happenedOn: input.record.happenedOn,
    happenedAt: input.record.happenedAt,
    text: input.record.text,
    tags: input.record.tags,
    parentNotes: input.record.parentNotes,
    createdByUserId: input.userId
  });

  await recordGrowthRecordCreated(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    recordId: String(record.id)
  });

  return record;
}

export async function deleteGrowthRecordForFamily(
  supabase: SupabaseClient,
  input: { familyId: UUID; recordId: UUID; referenceDate?: Date }
) {
  const record = await getGrowthRecordForFamily(supabase, input);

  if (!record) {
    throw new GrowthRecordError("Growth record was not found");
  }

  const existingPhotoCount = (record.growth_record_media ?? []).filter(
    (media) => media.media_type === "photo"
  ).length;
  if (existingPhotoCount >= 3) {
    throw new GrowthRecordError("A growth record supports up to 3 photos");
  }

  const window = buildRestoreWindow(input.referenceDate ?? new Date());
  await softDeleteGrowthRecord(supabase, {
    recordId: input.recordId,
    deletedAt: window.deletedAt,
    restoreUntil: window.restoreUntil
  });
}

export async function restoreGrowthRecordForFamily(
  supabase: SupabaseClient,
  input: { familyId: UUID; recordId: UUID; referenceDate?: Date }
) {
  const record = await getGrowthRecordForFamily(supabase, input);

  if (!record || !record.deleted_at || !record.restore_until) {
    throw new GrowthRecordError("Growth record cannot be restored");
  }

  if (new Date(record.restore_until).getTime() < (input.referenceDate ?? new Date()).getTime()) {
    throw new GrowthRecordError("Restore window has expired");
  }

  await restoreGrowthRecord(supabase, input.recordId);
}

export async function attachGrowthRecordPhotoForFamily(
  supabase: SupabaseClient,
  storageSupabase: SupabaseClient,
  input: { familyId: UUID; recordId: UUID; file: File }
) {
  const record = await getGrowthRecordForFamily(supabase, {
    familyId: input.familyId,
    recordId: input.recordId
  });

  if (!record) {
    throw new GrowthRecordError("Growth record was not found");
  }

  const fileName = input.file.name || `photo-${Date.now()}.jpg`;
  const storagePath = buildGrowthMediaStoragePath({
    familyId: input.familyId,
    childId: record.child_id,
    recordId: input.recordId,
    fileName
  });

  const { error } = await storageSupabase.storage
    .from(growthRecordBucket)
    .upload(storagePath, await input.file.arrayBuffer(), {
      contentType: input.file.type || "image/jpeg",
      upsert: false
    });

  if (error) {
    throw error;
  }

  const media = await createGrowthRecordMedia(storageSupabase, {
    growthRecordId: input.recordId,
    storagePath,
    mediaType: "photo",
    fileName,
    mimeType: input.file.type || "image/jpeg",
    sizeBytes: input.file.size
  });

  const signed = await createGrowthMediaSignedReadUrl(storageSupabase, storagePath);

  return {
    ...media,
    signed_url: signed.signedUrl
  };
}

export function buildRestoreWindow(referenceDate: Date) {
  const restoreUntil = new Date(referenceDate);
  restoreUntil.setUTCDate(restoreUntil.getUTCDate() + 30);

  return {
    deletedAt: referenceDate.toISOString(),
    restoreUntil: restoreUntil.toISOString()
  };
}
