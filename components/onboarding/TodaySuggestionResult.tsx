"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/form";
import type { FirstGuidanceSuggestion } from "@/lib/ai/first-guidance";
import type { TaskAssigneeType } from "@/lib/domain/types";

const assigneeOptions: Array<{ value: TaskAssigneeType; label: string }> = [
  { value: "father", label: "爸爸" },
  { value: "mother", label: "妈妈" },
  { value: "family", label: "全家" }
];

export function TodaySuggestionResult({
  sessionId,
  suggestion
}: {
  sessionId: string;
  suggestion: FirstGuidanceSuggestion;
}) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [addedToWeeklyPlan, setAddedToWeeklyPlan] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [draftCreated, setDraftCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<TaskAssigneeType>("family");

  async function acceptSuggestion(options?: {
    addToWeeklyPlan?: boolean;
    taskAssigneeType?: TaskAssigneeType;
  }) {
    setError(null);
    setIsSaving(true);
    const response = await fetch(`/api/first-guidance/${sessionId}/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        entrySurface: "web_first_guidance",
        ...(options ?? {})
      })
    });
    const payload = await response.json().catch(() => ({}));

    setIsSaving(false);

    if (response.ok) {
      setAccepted(true);
      setAddedToWeeklyPlan(Boolean(payload.addedToWeeklyPlan));
      return;
    }

    if (response.status === 409) {
      setError("先完成完整孩子档案，再把建议加入本周计划。");
      return;
    }

    setError(payload.error ?? "暂时无法保存这条建议");
  }

  async function createGrowthRecordDraft() {
    setError(null);
    setIsCreatingDraft(true);

    const response = await fetch("/api/growth-record-drafts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sourceType: "ai_suggestion",
        sourceId: sessionId,
        parentNote: `${suggestion.action}。${suggestion.childSpecificContext}`,
        entrySurface: "web_first_guidance",
        actionType: "create_record_draft"
      })
    });
    const payload = await response.json().catch(() => ({}));

    setIsCreatingDraft(false);

    if (response.ok) {
      setDraftCreated(true);
      const draftId =
        payload && typeof payload === "object" && "draft" in payload
          ? (payload.draft as { id?: string } | undefined)?.id
          : undefined;
      router.push(draftId ? `/archive?draftId=${draftId}` : "/archive");
      return;
    }

    if (response.status === 409) {
      setError("先完成完整孩子档案，再把这次行动沉淀成成长记录。");
      return;
    }

    setError(payload.error ?? "暂时无法生成成长记录草稿");
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">今日陪伴建议</p>
          <h2 className="mt-1 text-xl font-semibold">{suggestion.title}</h2>
        </div>
        <div className="rounded-full bg-accent px-3 py-1 text-sm">
          {suggestion.estimatedMinutes} 分钟
        </div>
      </div>
      <div className="mt-5 grid gap-4 text-sm leading-6">
        <p>{suggestion.childSpecificContext}</p>
        <p>{suggestion.likelyInterpretation}</p>
        <div className="rounded-md bg-accent/70 p-4">
          <p className="font-medium">今晚可以这样做</p>
          <p className="mt-1">{suggestion.action}</p>
        </div>
        <p className="text-muted-foreground">{suggestion.whyItHelps}</p>
        <p className="text-muted-foreground">{suggestion.gentleFallback}</p>
      </div>
      <div className="mt-5 grid gap-3">
        <div className="flex flex-wrap gap-2">
          {assigneeOptions.map((option) => {
            const isSelected = selectedAssignee === option.value;
            return (
              <button
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  isSelected
                    ? "border-primary bg-accent"
                    : "border-border bg-background"
                }`}
                key={option.value}
                onClick={() => setSelectedAssignee(option.value)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            className="gap-2"
            disabled={accepted || isSaving}
            onClick={() => acceptSuggestion({ addToWeeklyPlan: false })}
            type="button"
          >
            {accepted && !addedToWeeklyPlan ? <Check className="h-4 w-4" /> : null}
            {accepted && !addedToWeeklyPlan
              ? "已采纳，今晚试试看"
              : isSaving
                ? "保存中"
                : "先试试看"}
          </Button>
          <Button
            className="gap-2 border border-border bg-transparent text-foreground hover:opacity-100"
            disabled={addedToWeeklyPlan || isSaving}
            onClick={() =>
              acceptSuggestion({
                addToWeeklyPlan: true,
                taskAssigneeType: selectedAssignee
              })
            }
            type="button"
          >
            {addedToWeeklyPlan ? <Check className="h-4 w-4" /> : null}
            {addedToWeeklyPlan ? "已加入本周计划" : "加入本周计划"}
          </Button>
        </div>
        {accepted && !addedToWeeklyPlan ? (
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              这条建议已经记为采纳。做完后，可以再把真实瞬间沉淀成成长记录。
            </p>
            <Button
              className="w-fit"
              disabled={isCreatingDraft}
              onClick={createGrowthRecordDraft}
              type="button"
            >
              {draftCreated ? "草稿已生成" : isCreatingDraft ? "生成中" : "做完了，记录一下"}
            </Button>
          </div>
        ) : null}
        {addedToWeeklyPlan ? (
          <p className="text-sm text-muted-foreground">
            这条建议已经进入本周计划，后续可以在周计划里完成并转成成长记录。
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </section>
  );
}
