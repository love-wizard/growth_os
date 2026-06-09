import { getJson, patchJson } from "../../services/api";

const emptyPlan = {
  theme: "本周计划",
  weekendActivity: "完成首次配置后，会生成适合本周的家庭活动。",
  fatherTasks: [],
  motherTasks: [],
  familyTasks: [],
  childTasks: []
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

Page({
  data: {
    isLoading: false,
    errorMessage: "",
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
