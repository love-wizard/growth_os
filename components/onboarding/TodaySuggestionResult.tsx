"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/form";
import type { FirstGuidanceSuggestion } from "@/lib/ai/first-guidance";

export function TodaySuggestionResult({
  sessionId,
  suggestion
}: {
  sessionId: string;
  suggestion: FirstGuidanceSuggestion;
}) {
  const [accepted, setAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function acceptSuggestion() {
    setIsSaving(true);
    const response = await fetch(`/api/first-guidance/${sessionId}/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        addToWeeklyPlan: false
      })
    });

    setIsSaving(false);

    if (response.ok) {
      setAccepted(true);
    }
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
      <Button
        className="mt-5 gap-2"
        disabled={accepted || isSaving}
        onClick={acceptSuggestion}
        type="button"
      >
        {accepted ? <Check className="h-4 w-4" /> : null}
        {accepted ? "已接受" : isSaving ? "保存中" : "接受建议"}
      </Button>
    </section>
  );
}
