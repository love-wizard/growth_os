import { getJson, patchJson, postJson, postJsonWithOptions } from "../../services/api";

const aiRequestTimeoutMs = 30000;

const emptyPlan = {
  theme: "本周计划",
  weekendActivity: "完成首次配置后，会生成适合本周的家庭活动。",
  fatherTasks: [],
  motherTasks: [],
  familyTasks: [],
  childTasks: []
};

const emptyNextWeekDraft = {
  draftId: "",
  theme: "",
  readingRecommendation: "",
  englishRecommendation: "",
  weekendActivity: "",
  fatherTasks: [] as string[],
  motherTasks: [] as string[],
  childTasks: [] as string[],
  isConfirmed: false
};

function formatTask(task: {
  id: string;
  title: string;
  completed_count: number;
  planned_count: number;
  status: string;
}) {
  return {
    id: task.id,
    title: task.title,
    progress: `${task.completed_count}/${task.planned_count}`,
    completedCount: task.completed_count,
    plannedCount: task.planned_count,
    note: task.status === "completed" ? "已完成" : "慢慢来，不需要补任务"
  };
}

function formatPlan(plan: {
  theme: string;
  weekend_activity?: string | null;
  groupedTasks?: Record<string, Array<{
    id: string;
    title: string;
    completed_count: number;
    planned_count: number;
    status: string;
  }>>;
} | null) {
  if (!plan) {
    return emptyPlan;
  }

  const grouped = plan.groupedTasks || {};
  return {
    theme: plan.theme,
    weekendActivity: plan.weekend_activity || "留一个轻松的家庭陪伴时刻。",
    fatherTasks: (grouped.father || []).map(formatTask),
    motherTasks: (grouped.mother || []).map(formatTask),
    familyTasks: (grouped.family || []).map(formatTask),
    childTasks: (grouped.child || []).map(formatTask)
  };
}

function formatDraftTask(task: { title: string; plannedCount: number }) {
  return `${task.title} ${task.plannedCount}次`;
}

function formatNextWeekDraft(
  response: {
    theme: string;
    readingRecommendation: string;
    englishRecommendation: string;
    weekendActivity: string;
    fatherTasks?: Array<{ title: string; plannedCount: number }>;
    motherTasks?: Array<{ title: string; plannedCount: number }>;
    childTasks?: Array<{ title: string; plannedCount: number }>;
  },
  draftId: string
) {
  return {
    draftId,
    theme: response.theme,
    readingRecommendation: response.readingRecommendation,
    englishRecommendation: response.englishRecommendation,
    weekendActivity: response.weekendActivity,
    fatherTasks: (response.fatherTasks || []).map(formatDraftTask),
    motherTasks: (response.motherTasks || []).map(formatDraftTask),
    childTasks: (response.childTasks || []).map(formatDraftTask),
    isConfirmed: false
  };
}

Page({
  data: {
    isLoading: false,
    isGeneratingDraft: false,
    isConfirmingDraft: false,
    errorMessage: "",
    draftErrorMessage: "",
    nextWeekDraft: null as null | typeof emptyNextWeekDraft,
    ...emptyPlan
  },
  onShow() {
    this.loadWeeklyPlan();
  },
  loadWeeklyPlan() {
    this.setData({ isLoading: true, errorMessage: "" });
    void getJson<{ weeklyPlan: Parameters<typeof formatPlan>[0] }>("/api/weekly-plan/current")
      .then((response) => {
        this.setData({
          isLoading: false,
          errorMessage: "",
          ...formatPlan(response.weeklyPlan)
        });
      })
      .catch((error) => {
        this.setData({
          isLoading: false,
          errorMessage:
            error.statusCode === 409 ? "请先完成首次配置" : error.error || "周计划加载失败"
        });
      });
  },
  generateNextWeekDraft() {
    this.setData({
      isGeneratingDraft: true,
      draftErrorMessage: "",
      nextWeekDraft: null
    });

    void postJsonWithOptions<{
      response: {
        mode: "weekly_plan_draft";
        theme: string;
        readingRecommendation: string;
        englishRecommendation: string;
        weekendActivity: string;
        fatherTasks?: Array<{ title: string; plannedCount: number }>;
        motherTasks?: Array<{ title: string; plannedCount: number }>;
        childTasks?: Array<{ title: string; plannedCount: number }>;
      };
      weeklyPlanDraftId?: string | null;
    }>("/api/ai/coach", {
      mode: "weekly_plan_draft",
      message: "请基于当前完成情况，重新生成一版下周周计划草案。"
    }, {
      timeoutMs: aiRequestTimeoutMs
    })
      .then((result) => {
        if (!result.weeklyPlanDraftId) {
          this.setData({
            isGeneratingDraft: false,
            draftErrorMessage: "草案生成成功，但缺少确认标识"
          });
          return;
        }

        this.setData({
          isGeneratingDraft: false,
          nextWeekDraft: formatNextWeekDraft(result.response, result.weeklyPlanDraftId)
        });
      })
      .catch((error) => {
        this.setData({
          isGeneratingDraft: false,
          draftErrorMessage:
            error.statusCode === 409
              ? "请先完成首次配置"
              : error.error || "下周计划草案生成失败"
        });
      });
  },
  confirmNextWeekDraft() {
    const draftId = this.data.nextWeekDraft?.draftId;

    if (!draftId || this.data.nextWeekDraft?.isConfirmed) {
      return;
    }

    this.setData({
      isConfirmingDraft: true,
      draftErrorMessage: ""
    });

    void postJson<{ weeklyPlanId: string }>(`/api/ai/weekly-plan-drafts/${draftId}/confirm`, {})
      .then(() => {
        wx.showToast({ title: "已更新下周计划", icon: "success" });
        this.setData({
          isConfirmingDraft: false,
          nextWeekDraft: this.data.nextWeekDraft
            ? {
                ...this.data.nextWeekDraft,
                isConfirmed: true
              }
            : null
        });
      })
      .catch((error) => {
        this.setData({
          isConfirmingDraft: false,
          draftErrorMessage: error.error || "采用下周计划失败"
        });
      });
  },
  completeTask(event: { currentTarget: { dataset: { title: string } } }) {
    const { taskId, completedCount, plannedCount } = event.currentTarget.dataset as {
      taskId?: string;
      completedCount?: string | number;
      plannedCount?: string | number;
    };
    if (!taskId) {
      return;
    }

    const nextCompletedCount = Math.min(Number(completedCount) + 1, Number(plannedCount));
    void patchJson(`/api/weekly-plan/tasks/${taskId}/progress`, {
      completedCount: nextCompletedCount
    })
      .then(() => {
        wx.showToast({ title: "已记录", icon: "success" });
        this.loadWeeklyPlan();
      })
      .catch((error) => {
        wx.showToast({ title: error.error || "更新失败", icon: "none" });
      });
  }
});
