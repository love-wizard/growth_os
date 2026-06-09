import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { recordGrowthRecordCreated } from "@/lib/metrics/growth-record-events";
import { getFamilyChildId } from "@/lib/repositories/weekly-plan-repo";
import {
  createGrowthRecord,
  getGrowthRecordForFamily,
  listRecentGrowthRecords,
  restoreGrowthRecord,
  softDeleteGrowthRecord
} from "@/lib/repositories/growth-record-repo";
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
  input: { familyId: UUID }
) {
  const childId = await getFamilyChildId(supabase, input.familyId);

  if (!childId) {
    return [];
  }

  return listRecentGrowthRecords(supabase, childId);
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

export function buildRestoreWindow(referenceDate: Date) {
  const restoreUntil = new Date(referenceDate);
  restoreUntil.setUTCDate(restoreUntil.getUTCDate() + 30);

  return {
    deletedAt: referenceDate.toISOString(),
    restoreUntil: restoreUntil.toISOString()
  };
}
