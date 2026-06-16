import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { recordGrowthRecordCreated } from "@/lib/metrics/growth-record-events";
import { resolveActiveChildId } from "@/lib/services/active-child-service";
import {
  createGrowthRecord,
  createGrowthRecordMedia,
  getGrowthRecordForFamily,
  listRecentGrowthRecords,
  restoreGrowthRecord,
  softDeleteGrowthRecord,
  updateGrowthRecordContent,
  upsertGrowthRecordChildren
} from "@/lib/repositories/growth-record-repo";
import { listFamilyChildren } from "@/lib/repositories/child-repo";
import {
  buildGrowthMediaStoragePath,
  createGrowthMediaSignedReadUrl,
  growthRecordBucket
} from "@/lib/services/storage-service";
import { elapsedMs, logPerf, nowMs } from "@/lib/services/perf-log";
import type { z } from "zod";
import {
  growthRecordInputSchema,
  growthRecordUpdateSchema
} from "@/lib/validation/schemas";

export class GrowthRecordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GrowthRecordError";
  }
}

export type GrowthRecordRequest = z.infer<typeof growthRecordInputSchema>;
export type GrowthRecordUpdateRequest = z.infer<typeof growthRecordUpdateSchema>;

export async function listGrowthRecordsForFamily(
  supabase: SupabaseClient,
  storageSupabase: SupabaseClient,
  input: {
    familyId: UUID;
    childId?: UUID;
    scope?: "child" | "family";
    limit?: number;
    offset?: number;
  }
) {
  const startedAt = nowMs();
  const childStartedAt = nowMs();
  const childId =
    input.scope === "family"
      ? undefined
      : await resolveActiveChildId(supabase, {
          familyId: input.familyId,
          childId: input.childId
        });
  const childMs = elapsedMs(childStartedAt);

  if (!childId && input.scope !== "family") {
    logPerf("service.growth-records.list", {
      totalMs: elapsedMs(startedAt),
      childMs,
      hasChild: false,
      familyId: input.familyId
    });
    return {
      records: [],
      hasMore: false,
      nextOffset: input.offset ?? 0
    };
  }

  const recordsStartedAt = nowMs();
  const page = await listRecentGrowthRecords(
    supabase,
    {
      familyId: input.familyId,
      childId,
      scope: input.scope ?? "child"
    },
    {
      limit: input.limit ?? 20,
      offset: input.offset ?? 0
    }
  );
  const recordsMs = elapsedMs(recordsStartedAt);

  const signingStartedAt = nowMs();
  const recordsWithMedia = await Promise.all(
    page.records.map(async (record) => ({
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
    recordCount: page.records.length,
    hasMore: page.hasMore,
    nextOffset: page.nextOffset,
    mediaCount: recordsWithMedia.reduce(
      (count, record) => count + (record.growth_record_media?.length ?? 0),
      0
    )
  });

  return {
    records: recordsWithMedia,
    hasMore: page.hasMore,
    nextOffset: page.nextOffset
  };
}

export async function saveGrowthRecord(
  supabase: SupabaseClient,
  input: { familyId: UUID; childId?: UUID; userId: UUID; record: GrowthRecordRequest }
) {
  const childId = await resolveActiveChildId(supabase, {
    familyId: input.familyId,
    childId: input.childId
  });

  if (!childId) {
    throw new GrowthRecordError("Child profile is required");
  }

  const childIds = await normalizeGrowthRecordChildIds(supabase, {
    familyId: input.familyId,
    primaryChildId: childId,
    requestedChildIds: input.record.childIds
  });

  const record = await createGrowthRecord(supabase, {
    childId,
    childIds,
    happenedOn: input.record.happenedOn,
    happenedAt: input.record.happenedAt ?? new Date().toISOString(),
    text: input.record.text,
    tags: input.record.tags,
    parentNotes: input.record.parentNotes,
    createdByUserId: input.userId
  });
  await upsertGrowthRecordChildren(supabase, {
    growthRecordId: String(record.id),
    childIds
  });

  await recordGrowthRecordCreated(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    recordId: String(record.id)
  });

  return record;
}

async function normalizeGrowthRecordChildIds(
  supabase: SupabaseClient,
  input: { familyId: UUID; primaryChildId: UUID; requestedChildIds?: UUID[] }
) {
  const requested = input.requestedChildIds?.length
    ? input.requestedChildIds
    : [input.primaryChildId];
  const uniqueRequested = [...new Set([input.primaryChildId, ...requested])];
  const familyChildren = await listFamilyChildren(supabase, input.familyId);
  const familyChildIds = new Set(familyChildren.map((child) => child.id));

  if (uniqueRequested.some((childId) => !familyChildIds.has(childId))) {
    throw new GrowthRecordError("Selected children must belong to this family");
  }

  return uniqueRequested;
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

export async function updateGrowthRecordForFamily(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    recordId: UUID;
    record: GrowthRecordUpdateRequest;
  }
) {
  const existing = await getGrowthRecordForFamily(supabase, input);

  if (!existing || existing.deleted_at) {
    throw new GrowthRecordError("Growth record was not found");
  }

  return updateGrowthRecordContent(supabase, {
    recordId: input.recordId,
    happenedOn: input.record.happenedOn,
    text: input.record.text,
    tags: input.record.tags,
    parentNotes: input.record.parentNotes,
    draftStatus: input.record.draftStatus ?? "saved"
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
