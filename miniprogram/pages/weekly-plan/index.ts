import {
  getActiveChildId,
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
const growthRecordPrefillStorageKey = "growth_os_growth_record_prefill";

type WeeklyChild = {
  id: string;
  nickname: string;
  selected?: boolean;
};

const emptyPlan = {
  theme: "",
  weekendActivity: "",
  fatherTasks: [],
  motherTasks: [],
  familyTasks: [],
  childTasks: [],
  totalTaskCount: 0,
  completedTaskCount: 0,
  completionLabel: "0/0",
  recentlyCompletedTask: null as null | {
    id: string;
    title: string;
  }
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

function weeklyPlanCacheKey(childId?: string) {
  return childId ? `${weeklyPlanCacheStorageKey}_${childId}` : weeklyPlanCacheStorageKey;
}

Page({
  data: {
    isLoading: false,
    isChildrenLoading: false,
    hasWeeklyPlanData: false,
    isGeneratingDraft: false,
    isConfirmingDraft: false,
    errorMessage: "",
    draftErrorMessage: "",
    children: [] as WeeklyChild[],
    selectedChildId: "",
    selectedChildName: "",
    nextWeekDraft: null as null | typeof emptyNextWeekDraft,
    ...emptyPlan
  },
  onShow() {
    void this.loadChildren().then(() => {
      const usedCache = this.hydrateWeeklyPlanCache();
      this.loadWeeklyPlan({ useLoadingState: !usedCache, skipIfFresh: usedCache });
    });
  },
  loadChildren() {
    this.setData({ isChildrenLoading: true });

    return getJson<{ children: WeeklyChild[] }>("/api/children")
      .then((response) => {
        const rawChildren = response.children || [];
        const selectedChildId =
          this.data.selectedChildId ||
          getActiveChildId() ||
          rawChildren[0]?.id ||
          "";
        const selectedChildName =
          rawChildren.find((child) => child.id === selectedChildId)?.nickname ||
          rawChildren[0]?.nickname ||
          "";

        this.setData({
          isChildrenLoading: false,
          children: rawChildren.map((child) => ({
            ...child,
            selected: child.id === selectedChildId
          })),
          selectedChildId,
          selectedChildName
        });
      })
      .catch(() => {
        this.setData({ isChildrenLoading: false });
      });
  },
  hydrateWeeklyPlanCache() {
    const cached = wx.getStorageSync(weeklyPlanCacheKey(this.data.selectedChildId)) as
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
      const cached = wx.getStorageSync(weeklyPlanCacheKey(this.data.selectedChildId)) as
        | { savedAt?: number }
        | undefined;

      if (isFreshCache(cached?.savedAt)) {
        return;
      }
    }

    if (options?.useLoadingState !== false) {
      this.setData({ isLoading: true, errorMessage: "" });
    }

    const childQuery = this.data.selectedChildId
      ? `?childId=${encodeURIComponent(this.data.selectedChildId)}`
      : "";

    void getJson<{ weeklyPlan: Parameters<typeof formatPlan>[0] }>(`/api/weekly-plan/current${childQuery}`)
      .then((response) => {
        const weeklyPlan = formatPlan(response.weeklyPlan);
        wx.setStorageSync(weeklyPlanCacheKey(this.data.selectedChildId), {
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
            error.statusCode === 409 ? "请先完成首次配置" : error.error || "周计划暂时无法同步"
        });
      });
  },
  chooseChild(event: { currentTarget: { dataset: { id?: string } } }) {
    const childId = event.currentTarget.dataset.id;
    if (!childId || childId === this.data.selectedChildId) {
      return;
    }

    const selectedChild = (this.data.children as WeeklyChild[]).find((child) => child.id === childId);
    this.setData({
      selectedChildId: childId,
      selectedChildName: selectedChild?.nickname || "",
      nextWeekDraft: null,
      draftErrorMessage: "",
      hasWeeklyPlanData: false,
      ...emptyPlan,
      children: (this.data.children as WeeklyChild[]).map((child) => ({
        ...child,
        selected: child.id === childId
      }))
    });

    const usedCache = this.hydrateWeeklyPlanCache();
    this.loadWeeklyPlan({ useLoadingState: !usedCache, skipIfFresh: usedCache });
  },
  generateNextWeekDraft() {
    this.setData({
      isGeneratingDraft: true,
      draftErrorMessage: "",
      nextWeekDraft: null
    });

    const childQuery = this.data.selectedChildId
      ? `?childId=${encodeURIComponent(this.data.selectedChildId)}`
      : "";

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
    }>(`/api/ai/coach${childQuery}`, {
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
            : error.error || "下周计划草案生成未成功";
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
          : error.error || "采用下周计划未成功";
        this.setData({
          isConfirmingDraft: false,
          draftErrorMessage: errorMessage
        });
      });
  },
  completeTask(event: { currentTarget: { dataset: { title: string } } }) {
    const { taskId, completedCount, plannedCount, title } = event.currentTarget.dataset as {
      taskId?: string;
      completedCount?: string | number;
      plannedCount?: string | number;
      title?: string;
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
      completionLabel: this.data.completionLabel,
      recentlyCompletedTask: this.data.recentlyCompletedTask
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
      recentlyCompletedTask:
        nextCompletedCount > Number(completedCount)
          ? {
              id: taskId,
              title: title || "完成了一项陪伴小事"
            }
          : previousPlan.recentlyCompletedTask,
      ...summarizePlan([...nextFatherTasks, ...nextMotherTasks, ...nextFamilyTasks, ...nextChildTasks])
    };
    this.setData(weeklyPlan);
    wx.setStorageSync(weeklyPlanCacheKey(this.data.selectedChildId), {
      savedAt: Date.now(),
      weeklyPlan
    });

    void patchJson(`/api/weekly-plan/tasks/${taskId}/progress`, {
      completedCount: nextCompletedCount,
      entrySurface: "weekly_plan"
    })
      .then(() => {
        wx.showToast({ title: "已记录", icon: "success" });
        wx.removeStorageSync(dashboardCacheStorageKey);
        this.loadWeeklyPlan({ useLoadingState: false });
      })
      .catch((error) => {
        this.setData(previousPlan);
        wx.setStorageSync(weeklyPlanCacheKey(this.data.selectedChildId), {
          savedAt: Date.now(),
          weeklyPlan: previousPlan
        });
        wx.showToast({ title: error.error || "更新未成功", icon: "none" });
      });
  },
  createGrowthRecordDraftForCompletedTask() {
    const task = this.data.recentlyCompletedTask as
      | {
          id: string;
          title: string;
        }
      | null;

    if (!task?.id) {
      wx.showToast({ title: "先完成一项小事", icon: "none" });
      return;
    }

    const parentNote = `${task.title}。今天真的做到了一个小推进。`;

    wx.setStorageSync(growthRecordPrefillStorageKey, {
      text: parentNote,
      tags: this.data.theme ? `${this.data.theme},成长瞬间` : "成长瞬间"
    });
    wx.switchTab({ url: "/pages/archive/index" });
  }
});
