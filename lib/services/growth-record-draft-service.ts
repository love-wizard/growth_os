import type { SupabaseClient } from "@supabase/supabase-js";
import type { GrowthRecordDraftSourceType, UUID } from "@/lib/domain/types";
import { recordGrowthRecordDraftCreated } from "@/lib/metrics/growth-record-events";
import { createGrowthRecord } from "@/lib/repositories/growth-record-repo";
import { getFamilyChildId } from "@/lib/repositories/weekly-plan-repo";
import type { z } from "zod";
import { growthRecordDraftRequestSchema } from "@/lib/validation/schemas";

export type GrowthRecordDraftRequest = z.infer<
  typeof growthRecordDraftRequestSchema
>;

export class GrowthRecordDraftError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GrowthRecordDraftError";
  }
}

export async function createGrowthRecordDraft(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; draft: GrowthRecordDraftRequest }
) {
  const childId = await getFamilyChildId(supabase, input.familyId);

  if (!childId) {
    throw new GrowthRecordDraftError("Child profile is required");
  }

  const record = await createGrowthRecord(supabase, {
    childId,
    happenedOn: new Date().toISOString().slice(0, 10),
    text: buildDraftText(input.draft.sourceType, input.draft.parentNote),
    parentNotes: input.draft.parentNote,
    createdByUserId: input.userId,
    draftSourceType: input.draft.sourceType as GrowthRecordDraftSourceType,
    draftSourceId: input.draft.sourceId,
    draftStatus: "draft"
  });

  await recordGrowthRecordDraftCreated(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    recordId: String(record.id),
    sourceType: input.draft.sourceType,
    entrySurface: input.draft.entrySurface,
    actionType: input.draft.actionType
  });

  return record;
}

export function buildDraftText(
  sourceType: GrowthRecordDraftRequest["sourceType"],
  parentNote?: string
) {
  if (sourceType === "weekly_task") {
    return parentNote?.trim() || "完成了一项本周成长任务。";
  }

  if (sourceType === "ai_suggestion") {
    return parentNote?.trim() || "采纳了一条 AI 陪伴建议，并完成了行动。";
  }

  return parentNote?.trim() || "记录一个今天真实发生的成长瞬间。";
}
