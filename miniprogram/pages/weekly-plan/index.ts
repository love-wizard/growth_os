import {
  getJson,
  isTimeoutRequestError,
  patchJson,
  postJson,
  postJsonWithOptions
} from "../../services/api";

const aiRequestTimeoutMs = 30000;
const weeklyPlanCacheStorageKey = "growth_os_weekly_plan_cache";
const weeklyPlanCacheRefreshMs = 5 * 60 * 1000;
const weeklyPlanCacheDisplayMs = 24 * 60 * 60 * 1000;
const dashboardCacheStorageKey = "growth_os_dashboard_cache";

const emptyPlan = {
  theme: "",
  weekendActivity: "",
  fatherTasks: [],
  motherTasks: [],
  familyTasks: [],
  childTasks: [],
  totalTaskCount: 0,
  completedTaskCount: 0,
  completionLabel: "0/0"
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

function summarizePlan(tasks: Array<{ completedCount: number; plannedCount: number }>) {
  const completedTaskCount = tasks.reduce((sum, task) => sum + task.completedCount, 0);
  const totalTaskCount = tasks.reduce((sum, task) => sum + task.plannedCount, 0);
  return {
    totalTaskCount,
    completedTaskCount,
    completionLabel: `${completedTaskCount}/${totalTaskCount}`
  };
}

function buildTaskProgressUpdate(task: {
  completedCount: number;
  plannedCount: number;
}) {
  const completedCount = Math.min(task.completedCount + 1, task.plannedCount);
  return {
    completedCount,
    progress: `${completedCount}/${task.plannedCount}`,
    note: completedCount >= task.plannedCount ? "已完成" : "慢慢来，不需要补任务"
  };
}

function updateTaskInList<T extends {
  id: string;
  completedCount: number;
  plannedCount: number;
  progress: string;
  note: string;
}>(tasks: T[], taskId: string) {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          ...buildTaskProgressUpdate(task)
        }
      : task
  );
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
  const fatherTasks = (grouped.father || []).map(formatTask);
  const motherTasks = (grouped.mother || []).map(formatTask);
  const familyTasks = (grouped.family || []).map(formatTask);
  const childTasks = (grouped.child || []).map(formatTask);
  const summary = summarizePlan([...fatherTasks, ...motherTasks, ...familyTasks, ...childTasks]);

  return {
    theme: plan.theme,
    weekendActivity: plan.weekend_activity || "留一个轻松的家庭陪伴时刻。",
    fatherTasks,
    motherTasks,
    familyTasks,
    childTasks,
    ...summary
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

function isFreshCache(savedAt?: number, ttlMs = weeklyPlanCacheRefreshMs) {
  return Boolean(savedAt && Date.now() - savedAt <= ttlMs);
}

function canDisplayCache(savedAt?: number, ttlMs = weeklyPlanCacheDisplayMs) {
  return Boolean(savedAt && Date.now() - savedAt <= ttlMs);
}

Page({
  data: {
    isLoading: false,
    hasWeeklyPlanData: false,
    isGeneratingDraft: false,
    isConfirmingDraft: false,
    errorMessage: "",
    draftErrorMessage: "",
    nextWeekDraft: null as null | typeof emptyNextWeekDraft,
    ...emptyPlan
  },
  onShow() {
    const usedCache = this.hydrateWeeklyPlanCache();
    this.loadWeeklyPlan({ useLoadingState: !usedCache, skipIfFresh: usedCache });
  },
  hydrateWeeklyPlanCache() {
    const cached = wx.getStorageSync(weeklyPlanCacheStorageKey) as
      | { savedAt?: number; weeklyPlan?: typeof emptyPlan }
      | undefined;

    if (!cached?.savedAt || !cached.weeklyPlan || !canDisplayCache(cached.savedAt)) {
      return false;
    }

    this.setData({
      isLoading: false,
      hasWeeklyPlanData: true,
      errorMessage: "",
      ...cached.weeklyPlan
    });
    return true;
  },
  loadWeeklyPlan(options?: { useLoadingState?: boolean; skipIfFresh?: boolean }) {
    if (options?.skipIfFresh) {
      const cached = wx.getStorageSync(weeklyPlanCacheStorageKey) as
        | { savedAt?: number }
        | undefined;

      if (isFreshCache(cached?.savedAt)) {
        return;
      }
    }

    if (options?.useLoadingState !== false) {
      this.setData({ isLoading: true, errorMessage: "" });
    }

    void getJson<{ weeklyPlan: Parameters<typeof formatPlan>[0] }>("/api/weekly-plan/current")
      .then((response) => {
        const weeklyPlan = formatPlan(response.weeklyPlan);
        wx.setStorageSync(weeklyPlanCacheStorageKey, {
          savedAt: Date.now(),
          weeklyPlan
        });
        this.setData({
          isLoading: false,
          hasWeeklyPlanData: true,
          errorMessage: "",
          ...weeklyPlan
        });
      })
      .catch((error) => {
        this.setData({
          isLoading: false,
          hasWeeklyPlanData: false,
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
        const errorMessage = isTimeoutRequestError(error)
          ? "这次生成下周计划稍久，已超过等待时间，请再试一次。"
          : error.statusCode === 409
            ? "请先完成首次配置"
            : error.error || "下周计划草案生成失败";
        this.setData({
          isGeneratingDraft: false,
          draftErrorMessage: errorMessage
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
        const errorMessage = isTimeoutRequestError(error)
          ? "采用下周计划时等待超时，请再试一次。"
          : error.error || "采用下周计划失败";
        this.setData({
          isConfirmingDraft: false,
          draftErrorMessage: errorMessage
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
    const previousPlan = {
      theme: this.data.theme,
      weekendActivity: this.data.weekendActivity,
      fatherTasks: this.data.fatherTasks,
      motherTasks: this.data.motherTasks,
      familyTasks: this.data.familyTasks,
      childTasks: this.data.childTasks,
      totalTaskCount: this.data.totalTaskCount,
      completedTaskCount: this.data.completedTaskCount,
      completionLabel: this.data.completionLabel
    };
    const nextFatherTasks = updateTaskInList(this.data.fatherTasks, taskId);
    const nextMotherTasks = updateTaskInList(this.data.motherTasks, taskId);
    const nextFamilyTasks = updateTaskInList(this.data.familyTasks, taskId);
    const nextChildTasks = updateTaskInList(this.data.childTasks, taskId);
    const weeklyPlan = {
      ...previousPlan,
      fatherTasks: nextFatherTasks,
      motherTasks: nextMotherTasks,
      familyTasks: nextFamilyTasks,
      childTasks: nextChildTasks,
      ...summarizePlan([...nextFatherTasks, ...nextMotherTasks, ...nextFamilyTasks, ...nextChildTasks])
    };
    this.setData(weeklyPlan);
    wx.setStorageSync(weeklyPlanCacheStorageKey, {
      savedAt: Date.now(),
      weeklyPlan
    });

    void patchJson(`/api/weekly-plan/tasks/${taskId}/progress`, {
      completedCount: nextCompletedCount
    })
      .then(() => {
        wx.showToast({ title: "已记录", icon: "success" });
        wx.removeStorageSync(dashboardCacheStorageKey);
        this.loadWeeklyPlan({ useLoadingState: false });
      })
      .catch((error) => {
        this.setData(previousPlan);
        wx.setStorageSync(weeklyPlanCacheStorageKey, {
          savedAt: Date.now(),
          weeklyPlan: previousPlan
        });
        wx.showToast({ title: error.error || "更新失败", icon: "none" });
      });
  }
});
