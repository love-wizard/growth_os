"use client";

import { Check } from "lucide-react";

export function WeeklyPlanDraftConfirm({
  draftId,
  disabled = false
}: {
  draftId?: string | null;
  disabled?: boolean;
}) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled || !draftId}
      onClick={() => {
        if (draftId) {
          void fetch(`/api/ai/weekly-plan-drafts/${draftId}/confirm`, {
            method: "POST"
          });
        }
      }}
      type="button"
    >
      <Check className="h-4 w-4" aria-hidden="true" />
      确认为周计划
    </button>
  );
}
