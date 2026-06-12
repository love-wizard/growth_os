import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { resolveActiveChildId } from "@/lib/services/active-child-service";
import {
  createInterestParticipationRecord,
  getInterestParticipationRecordForFamily,
  listChildInterests,
  listRecentInterestParticipationRecords,
  restoreInterestParticipationRecord,
  softDeleteInterestParticipationRecord
} from "@/lib/repositories/interest-participation-repo";
import type { z } from "zod";
import { interestParticipationRecordInputSchema } from "@/lib/validation/schemas";

export class InterestParticipationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterestParticipationError";
  }
}

export type InterestParticipationInput = z.infer<
  typeof interestParticipationRecordInputSchema
>;

export async function listInterestParticipationSnapshot(
  supabase: SupabaseClient,
  input: { familyId: UUID; childId?: UUID }
) {
  const childId = await resolveActiveChildId(supabase, {
    familyId: input.familyId,
    childId: input.childId
  });

  if (!childId) {
    return {
      interests: [],
      records: []
    };
  }

  const [interests, records] = await Promise.all([
    listChildInterests(supabase, childId),
    listRecentInterestParticipationRecords(supabase, childId)
  ]);

  return { interests, records };
}

export async function recordInterestParticipation(
  supabase: SupabaseClient,
  input: { familyId: UUID; childId?: UUID; record: InterestParticipationInput }
) {
  const childId = await resolveActiveChildId(supabase, {
    familyId: input.familyId,
    childId: input.childId
  });

  if (!childId) {
    throw new InterestParticipationError("Child profile is required");
  }

  assertValidActualOutcome(input.record);

  return createInterestParticipationRecord(supabase, {
    childId,
    interestId: input.record.interestId,
    happenedOn: input.record.happenedOn,
    participationOutcome: input.record.participationOutcome,
    durationMinutes: input.record.durationMinutes,
    count: input.record.count,
    notes: input.record.notes
  });
}

export async function deleteInterestParticipationForFamily(
  supabase: SupabaseClient,
  input: { familyId: UUID; recordId: UUID; referenceDate?: Date }
) {
  const record = await getInterestParticipationRecordForFamily(supabase, input);

  if (!record) {
    throw new InterestParticipationError("Interest participation record was not found");
  }

  const deletedAt = input.referenceDate ?? new Date();
  const restoreUntil = new Date(deletedAt);
  restoreUntil.setUTCDate(restoreUntil.getUTCDate() + 30);

  await softDeleteInterestParticipationRecord(supabase, {
    recordId: input.recordId,
    deletedAt: deletedAt.toISOString(),
    restoreUntil: restoreUntil.toISOString()
  });
}

export async function restoreInterestParticipationForFamily(
  supabase: SupabaseClient,
  input: { familyId: UUID; recordId: UUID; referenceDate?: Date }
) {
  const record = await getInterestParticipationRecordForFamily(supabase, input);

  if (!record || !record.deleted_at || !record.restore_until) {
    throw new InterestParticipationError("Interest participation record cannot be restored");
  }

  if (new Date(record.restore_until).getTime() < (input.referenceDate ?? new Date()).getTime()) {
    throw new InterestParticipationError("Restore window has expired");
  }

  await restoreInterestParticipationRecord(supabase, input.recordId);
}

export function assertValidActualOutcome(record: InterestParticipationInput) {
  const hasPositiveDuration = (record.durationMinutes ?? 0) > 0;
  const hasPositiveCount = (record.count ?? 0) > 0;

  if (record.participationOutcome === "completed") {
    if (!hasPositiveDuration && !hasPositiveCount) {
      throw new InterestParticipationError(
        "Completed participation needs duration or count"
      );
    }
    return;
  }

  if (hasPositiveDuration || hasPositiveCount) {
    throw new InterestParticipationError(
      "Only completed participation can include positive duration or count"
    );
  }
}
