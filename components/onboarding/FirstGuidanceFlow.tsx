"use client";

import { FormEvent, useState } from "react";
import { Button, Input, Label } from "@/components/ui/form";
import { TodaySuggestionResult } from "@/components/onboarding/TodaySuggestionResult";
import type { FirstGuidanceSuggestion } from "@/lib/ai/first-guidance";
import {
  firstUseChildTraits,
  firstUseCurrentChallenges,
  firstUseFocusDirections
} from "@/lib/domain/types";

const focusLabels: Record<string, string> = {
  reading_habit: "阅读习惯",
  english_exposure: "英语启蒙",
  physical_activity: "身体活动",
  outdoor_exploration: "户外探索",
  music_or_piano_interest: "音乐/钢琴兴趣",
  swimming_or_sports: "游泳/运动",
  emotional_expression: "情绪表达",
  family_relationship: "家庭关系",
  school_readiness: "幼小衔接"
};

const challengeLabels: Record<string, string> = {
  interest_resistance: "孩子不想练琴或兴趣练习",
  reading_difficulty: "阅读难以坚持",
  unclear_english_exposure: "英语启蒙不清晰",
  limited_time_tonight: "今晚只有30分钟",
  weekend_activity_need: "需要周末活动",
  emotional_sensitivity: "最近情绪敏感",
  decreased_physical_activity: "最近运动减少",
  recent_growth_review: "想了解最近成长"
};

const traitLabels: Record<string, string> = {
  active: "精力充沛",
  sensitive: "敏感",
  slow_to_warm_up: "慢热",
  likes_praise: "喜欢被肯定",
  likes_competition: "喜欢挑战",
  strong_willed: "有主见",
  easily_frustrated: "容易受挫",
  curious: "好奇",
  prefers_routines: "喜欢稳定节奏"
};

export function FirstGuidanceFlow() {
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [focusDirections, setFocusDirections] = useState<string[]>([
    "reading_habit",
    "english_exposure"
  ]);
  const [currentChallenge, setCurrentChallenge] = useState("limited_time_tonight");
  const [childTraits, setChildTraits] = useState<string[]>(["curious"]);
  const [result, setResult] = useState<{
    sessionId: string;
    todaySuggestion: FirstGuidanceSuggestion;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/first-guidance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        childNickname: nickname,
        childBirthDate: birthDate,
        focusDirections,
        currentChallenge,
        childTraits
      })
    });

    const payload = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? "暂时无法生成建议");
      return;
    }

    setResult(payload);
  }

  return (
    <div className="grid gap-5">
      <form className="grid gap-5 rounded-lg border border-border bg-card p-5" onSubmit={submit}>
        <div className="grid gap-2">
          <Label htmlFor="nickname">孩子昵称</Label>
          <Input
            id="nickname"
            onChange={(event) => setNickname(event.target.value)}
            placeholder="小钟"
            required
            value={nickname}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="birthDate">出生日期</Label>
          <Input
            id="birthDate"
            onChange={(event) => setBirthDate(event.target.value)}
            required
            type="date"
            value={birthDate}
          />
        </div>
        <OptionGroup
          max={3}
          min={2}
          onChange={setFocusDirections}
          options={firstUseFocusDirections}
          selected={focusDirections}
          title="关注方向"
          labels={focusLabels}
        />
        <div className="grid gap-2">
          <Label htmlFor="challenge">当前挑战</Label>
          <select
            className="h-11 rounded-md border border-border bg-card px-3 text-sm"
            id="challenge"
            onChange={(event) => setCurrentChallenge(event.target.value)}
            value={currentChallenge}
          >
            {firstUseCurrentChallenges.map((challenge) => (
              <option key={challenge} value={challenge}>
                {challengeLabels[challenge]}
              </option>
            ))}
          </select>
        </div>
        <OptionGroup
          max={3}
          min={1}
          onChange={setChildTraits}
          options={firstUseChildTraits}
          selected={childTraits}
          title="孩子特质"
          labels={traitLabels}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "生成中" : "生成今日建议"}
        </Button>
      </form>
      {result ? (
        <TodaySuggestionResult
          sessionId={result.sessionId}
          suggestion={result.todaySuggestion}
        />
      ) : null}
    </div>
  );
}

function OptionGroup({
  title,
  options,
  selected,
  labels,
  min,
  max,
  onChange
}: {
  title: string;
  options: readonly string[];
  selected: string[];
  labels: Record<string, string>;
  min: number;
  max: number;
  onChange: (next: string[]) => void;
}) {
  function toggle(option: string) {
    if (selected.includes(option)) {
      if (selected.length > min) {
        onChange(selected.filter((item) => item !== option));
      }
      return;
    }

    if (selected.length < max) {
      onChange([...selected, option]);
    }
  }

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              aria-pressed={isSelected}
              className="rounded-md border border-border px-3 py-2 text-sm data-[selected=true]:border-primary data-[selected=true]:bg-accent"
              data-selected={isSelected}
              key={option}
              onClick={() => toggle(option)}
              type="button"
            >
              {labels[option]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
