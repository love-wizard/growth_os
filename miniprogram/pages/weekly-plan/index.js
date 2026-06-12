/* global Page, wx */
const {
  getActiveChildId,
  getJson,
  isTimeoutRequestError,
  patchJson,
  postJson,
  postJsonWithOptions
} = require("../../services/api");
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
  fatherTasks: [],
  motherTasks: [],
  childTasks: [],
  isConfirmed: false
};

function formatTask(task) {
  return {
    id: task.id,
    title: task.title,
    progress: `${task.completed_count}/${task.planned_count}`,
    completedCount: task.completed_count,
    plannedCount: task.planned_count,
    note: task.status === "completed" ? "已完成" : "慢慢来，不需要补任务"
  };
}

function summarizePlan(tasks) {
  const completedTaskCount = tasks.reduce((sum, task) => sum + task.completedCount, 0);
  const totalTaskCount = tasks.reduce((sum, task) => sum + task.plannedCount, 0);
  return {
    totalTaskCount,
    completedTaskCount,
    completionLabel: `${completedTaskCount}/${totalTaskCount}`
  };
}

function buildTaskProgressUpdate(task) {
  const completedCount = Math.min(task.completedCount + 1, task.plannedCount);
  return {
    completedCount,
    progress: `${completedCount}/${task.plannedCount}`,
    note: completedCount >= task.plannedCount ? "已完成" : "慢慢来，不需要补任务"
  };
}

function updateTaskInList(tasks, taskId) {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          ...buildTaskProgressUpdate(task)
        }
      : task
  );
}

function formatPlan(plan) {
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

function formatDraftTask(task) {
  return `${task.title} ${task.plannedCount}次`;
}

function formatNextWeekDraft(response, draftId) {
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

function isFreshCache(savedAt, ttlMs = weeklyPlanCacheRefreshMs) {
  return Boolean(savedAt && Date.now() - savedAt <= ttlMs);
}

function canDisplayCache(savedAt, ttlMs = weeklyPlanCacheDisplayMs) {
  return Boolean(savedAt && Date.now() - savedAt <= ttlMs);
}

function weeklyPlanCacheKey(childId) {
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
    children: [],
    selectedChildId: "",
    selectedChildName: "",
    nextWeekDraft: null,
    ...emptyPlan
  },
  onShow() {
    this.loadChildren().then(() => {
      const usedCache = this.hydrateWeeklyPlanCache();
      this.loadWeeklyPlan({ useLoadingState: !usedCache, skipIfFresh: usedCache });
    });
  },
  loadChildren() {
    this.setData({ isChildrenLoading: true });
    return getJson("/api/children")
      .then((response) => {
        const rawChildren = response.children || [];
        const selectedChildId =
          this.data.selectedChildId ||
          getActiveChildId() ||
          (rawChildren[0] && rawChildren[0].id) ||
          "";
        const selectedChild =
          rawChildren.find((child) => child.id === selectedChildId) ||
          rawChildren[0];
        this.setData({
          isChildrenLoading: false,
          children: rawChildren.map((child) => ({
            ...child,
            selected: child.id === selectedChildId
          })),
          selectedChildId,
          selectedChildName: selectedChild ? selectedChild.nickname : ""
        });
      })
      .catch(() => {
        this.setData({ isChildrenLoading: false });
      });
  },
  hydrateWeeklyPlanCache() {
    const cached = wx.getStorageSync(weeklyPlanCacheKey(this.data.selectedChildId));

    if (!cached || !cached.savedAt || !cached.weeklyPlan || !canDisplayCache(cached.savedAt)) {
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
  loadWeeklyPlan(options) {
    if (options && options.skipIfFresh) {
      const cached = wx.getStorageSync(weeklyPlanCacheKey(this.data.selectedChildId));
      if (isFreshCache(cached && cached.savedAt)) {
        return;
      }
    }

    if (!options || options.useLoadingState !== false) {
      this.setData({ isLoading: true, errorMessage: "" });
    }

    const childQuery = this.data.selectedChildId
      ? `?childId=${encodeURIComponent(this.data.selectedChildId)}`
      : "";

    getJson(`/api/weekly-plan/current${childQuery}`)
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
  chooseChild(event) {
    const childId = event.currentTarget.dataset.id;
    if (!childId || childId === this.data.selectedChildId) {
      return;
    }

    const selectedChild = this.data.children.find((child) => child.id === childId);
    this.setData({
      selectedChildId: childId,
      selectedChildName: selectedChild ? selectedChild.nickname : "",
      nextWeekDraft: null,
      draftErrorMessage: "",
      hasWeeklyPlanData: false,
      ...emptyPlan,
      children: this.data.children.map((child) => ({
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

    postJsonWithOptions(`/api/ai/coach${childQuery}`, {
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
    const draftId = this.data.nextWeekDraft && this.data.nextWeekDraft.draftId;

    if (!draftId || (this.data.nextWeekDraft && this.data.nextWeekDraft.isConfirmed)) {
      return;
    }

    this.setData({
      isConfirmingDraft: true,
      draftErrorMessage: ""
    });

    postJson(`/api/ai/weekly-plan-drafts/${draftId}/confirm`, {})
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
  completeTask(event) {
    const { taskId, completedCount, plannedCount } = event.currentTarget.dataset;
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
    wx.setStorageSync(weeklyPlanCacheKey(this.data.selectedChildId), {
      savedAt: Date.now(),
      weeklyPlan
    });

    patchJson(`/api/weekly-plan/tasks/${taskId}/progress`, {
      completedCount: nextCompletedCount
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
  }
});
