import { getJson } from "../../services/api";

const roleLabels: Record<string, string> = {
  father: "爸爸",
  mother: "妈妈",
  family: "家庭",
  child: "孩子"
};

const roleClasses: Record<string, string> = {
  father: "role-father",
  mother: "role-mother",
  family: "role-family",
  child: "role-family"
};

function formatTask(task: {
  id: string;
  assignee_type: string;
  title: string;
  planned_count: number;
  completed_count: number;
}) {
  return {
    id: task.id,
    role: roleLabels[task.assignee_type] || "家庭",
    roleClass: roleClasses[task.assignee_type] || "role-family",
    title: task.title,
    progress: `${task.completed_count}/${task.planned_count}`
  };
}

Page({
  data: {
    isLoading: false,
    setupRequired: false,
    errorMessage: "",
    childNickname: "小钟",
    weeklyTheme: "建立阅读习惯",
    taskCount: "3件小事",
    todayAction: {
      title: "今晚做一次10分钟亲子共读",
      context: "围绕本周主题《建立阅读习惯》，先做一件轻量的小事。",
      minutes: "10分钟",
      why: "让孩子把阅读和被陪伴的感受连接起来，而不是把阅读当成任务。"
    },
    tasks: [
      { role: "爸爸", roleClass: "role-father", title: "一次户外运动或探索", progress: "0/1" },
      { role: "妈妈", roleClass: "role-mother", title: "三次亲子阅读", progress: "1/3" },
      { role: "家庭", roleClass: "role-family", title: "周末一起观察一种植物", progress: "未开始" }
    ]
  },
  onShow() {
    this.loadDashboard();
  },
  loadDashboard() {
    this.setData({ isLoading: true, errorMessage: "" });
    void getJson<{
      child: { nickname: string } | null;
      weeklyPlan: { theme: string } | null;
      todayGuidance: { title: string; description: string } | null;
      progress: { description: string } | null;
      todayTasks: Array<{
        id: string;
        assignee_type: string;
        title: string;
        planned_count: number;
        completed_count: number;
      }>;
    }>("/api/dashboard")
      .then((dashboard) => {
        const tasks = (dashboard.todayTasks || []).map(formatTask);
        const weeklyTheme = dashboard.weeklyPlan ? dashboard.weeklyPlan.theme : "轻松陪伴";
        this.setData({
          isLoading: false,
          setupRequired: false,
          childNickname: dashboard.child ? dashboard.child.nickname : "孩子",
          weeklyTheme,
          taskCount: `${tasks.length}件小事`,
          todayAction: {
            title: dashboard.todayGuidance ? dashboard.todayGuidance.title : "今天留一个轻松陪伴时刻",
            context: dashboard.todayGuidance
              ? dashboard.todayGuidance.description
              : "如果没有明确任务，可以一起散步、共读或聊一件今天的小发现。",
            minutes: "10分钟",
            why: dashboard.progress ? dashboard.progress.description : "重点是父母和孩子一起完成。"
          },
          tasks
        });
      })
      .catch((error) => {
        if (error.statusCode === 409) {
          this.setData({
            isLoading: false,
            setupRequired: true,
            errorMessage: "还没有创建家庭成长系统"
          });
          return;
        }

        this.setData({
          isLoading: false,
          errorMessage: error.error || "首页数据加载失败"
        });
      });
  },
  startAction() {
    if (this.data.setupRequired) {
      wx.navigateTo({ url: "/pages/setup/index" });
      return;
    }
    wx.showToast({ title: "已开始陪伴", icon: "success" });
  },
  openCoach() {
    wx.switchTab({ url: "/pages/ai-coach/index" });
  },
  openArchive() {
    wx.switchTab({ url: "/pages/archive/index" });
  },
  openSetup() {
    wx.navigateTo({ url: "/pages/setup/index" });
  }
});
