import type { SupabaseClient } from "@supabase/supabase-js";
import { assembleAIContext, type AIContextSnapshot } from "@/lib/ai/context";
import {
  createLLMClient,
  createStructuredLLMCompletion,
  hasConfiguredLLM,
  parseLLMCompletionJson
} from "@/lib/ai/llm-client";
import {
  buildActivityGenerationPrompt,
  createActivityGenerationFallback,
  activityGenerationJsonSchema,
  activityGenerationResponseSchema
} from "@/lib/ai/modes/activity-generation";
import {
  buildGrowthAnalysisPrompt,
  createGrowthAnalysisFallback,
  growthAnalysisJsonSchema,
  growthAnalysisResponseSchema
} from "@/lib/ai/modes/growth-analysis";
import {
  buildParentingQAPrompt,
  createParentingQAFallback,
  parentingQAJsonSchema,
  parentingQAResponseSchema
} from "@/lib/ai/modes/parenting-qa";
import {
  buildWeeklyPlanDraftPrompt,
  createWeeklyPlanDraftFallback,
  weeklyPlanDraftJsonSchema,
  weeklyPlanDraftResponseSchema
} from "@/lib/ai/modes/weekly-plan-draft";
import { classifyAISafetyBoundary } from "@/lib/ai/safety-boundary";
import type { AICoachMode, ParentRole, UUID } from "@/lib/domain/types";
import { recordAICoachModeUsed } from "@/lib/metrics/ai-coach-events";
import {
  createAIConversation,
  createAIWeeklyPlanDraft
} from "@/lib/repositories/ai-repo";

const coachInstructions =
  "你是成长 OS 的 AI 成长教练。必须基于孩子真实档案、年度目标、周计划、课程记录和成长记录回答。优先给具体、可执行、低压力建议，避免空泛育儿理论和年龄不合适的建议。";

export type AICoachResponse =
  | ReturnType<typeof createParentingQAFallback>
  | ReturnType<typeof createActivityGenerationFallback>
  | ReturnType<typeof createGrowthAnalysisFallback>
  | ReturnType<typeof createWeeklyPlanDraftFallback>
  | {
      mode: "safety_boundary";
      title: string;
      summary: string;
      actions: string[];
    };

export async function askAICoach(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    userId: UUID;
    userRole: ParentRole;
    mode: AICoachMode;
    message: string;
    childId?: UUID;
    scope?: "child" | "family";
  }
) {
  const context = await assembleAIContext(
    supabase,
    input.familyId,
    new Date(),
    input.childId,
    input.scope ?? "child"
  );
  const response = await generateAICoachResponse(input.mode, input.message, context);
  const conversationId = await createAIConversation(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    userRole: input.userRole,
    mode: input.mode,
    message: input.message,
    response,
    contextWindowSummary: summarizeContext(context)
  });

  let weeklyPlanDraftId: UUID | null = null;

  if (response.mode === "weekly_plan_draft") {
    const childId = getChildId(context);

    if (childId) {
      weeklyPlanDraftId = await createAIWeeklyPlanDraft(supabase, {
        familyId: input.familyId,
        childId,
        aiConversationId: conversationId,
        draft: response
      });
    }
  }

  await recordAICoachModeUsed(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    mode: input.mode,
    conversationId
  });

  return {
    conversationId,
    weeklyPlanDraftId,
    response
  };
}

export async function generateAICoachResponse(
  mode: AICoachMode,
  message: string,
  context: AIContextSnapshot
): Promise<AICoachResponse> {
  const safety = classifyAISafetyBoundary(message);

  if (!safety.allowed && safety.fallbackResponse) {
    return {
      mode: "safety_boundary",
      ...safety.fallbackResponse
    };
  }

  if (hasConfiguredLLM()) {
    try {
      return await generateWithLLM(mode, message, context);
    } catch {
      return generateLocalResponse(mode, message, context);
    }
  }

  return generateLocalResponse(mode, message, context);
}

export function generateLocalResponse(
  mode: AICoachMode,
  message: string,
  context: AIContextSnapshot
): Exclude<AICoachResponse, { mode: "safety_boundary" }> {
  if (mode === "activity_generation") {
    return createActivityGenerationFallback(context);
  }

  if (mode === "growth_analysis") {
    return createGrowthAnalysisFallback(context, message);
  }

  if (mode === "weekly_plan_draft") {
    return createWeeklyPlanDraftFallback(context);
  }

  return createParentingQAFallback(context, message);
}

async function generateWithLLM(
  mode: AICoachMode,
  message: string,
  context: AIContextSnapshot
) {
  const request = getModeRequest(mode, message, context);
  const completion = await createStructuredLLMCompletion(createLLMClient(), {
    instructions: coachInstructions,
    input: request.prompt,
    schemaName: request.schemaName,
    jsonSchema: request.jsonSchema
  });

  return request.schema.parse(parseLLMCompletionJson(completion)) as AICoachResponse;
}

function getModeRequest(
  mode: AICoachMode,
  message: string,
  context: AIContextSnapshot
) {
  if (mode === "activity_generation") {
    return {
      prompt: buildActivityGenerationPrompt(context, message),
      schemaName: "activity_generation",
      jsonSchema: activityGenerationJsonSchema,
      schema: activityGenerationResponseSchema
    };
  }

  if (mode === "growth_analysis") {
    return {
      prompt: buildGrowthAnalysisPrompt(context, message),
      schemaName: "growth_analysis",
      jsonSchema: growthAnalysisJsonSchema,
      schema: growthAnalysisResponseSchema
    };
  }

  if (mode === "weekly_plan_draft") {
    return {
      prompt: buildWeeklyPlanDraftPrompt(context, message),
      schemaName: "weekly_plan_draft",
      jsonSchema: weeklyPlanDraftJsonSchema,
      schema: weeklyPlanDraftResponseSchema
    };
  }

  return {
    prompt: buildParentingQAPrompt(context, message),
    schemaName: "parenting_qa",
    jsonSchema: parentingQAJsonSchema,
    schema: parentingQAResponseSchema
  };
}

function summarizeContext(context: AIContextSnapshot) {
  const profile = context.childProfile as { id?: string; nickname?: string } | null;

  return {
    scope: context.scope,
    familyChildCount: context.familyChildren.length,
    childId: profile?.id ?? null,
    childNickname: profile?.nickname ?? null,
    annualGoalCount: context.annualGoals.length,
    weeklyPlanCount: context.weeklyPlans.length,
    interestRecordCount: context.interestParticipationRecords.length,
    growthRecordCount: context.growthRecords.length
  };
}

function getChildId(context: AIContextSnapshot) {
  const profile = context.childProfile as { id?: string } | null;
  return profile?.id ?? null;
}
