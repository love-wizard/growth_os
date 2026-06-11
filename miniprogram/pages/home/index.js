/* global Page, wx */
const { getJson } = require("../../services/api");
const growthRecordPrefillStorageKey = "growth_os_growth_record_prefill";
const childProfileCacheStorageKey = "growth_os_child_profile_cache";
const dashboardCacheStorageKey = "growth_os_dashboard_cache";
const weeklyPlanCacheStorageKey = "growth_os_weekly_plan_cache";
const growthRecordsCacheStorageKey = "growth_os_growth_records_cache_v2";
const dashboardCacheRefreshMs = 5 * 60 * 1000;
const dashboardCacheDisplayMs = 24 * 60 * 60 * 1000;

const dailyQuotes = [
  {
    quote: "游戏让孩子练习他们正在学习的东西。",
    source: "Fred Rogers（短句意译）",
    reflection: "今天给孩子一点自由尝试的时间，不急着纠正。"
  },
  {
    quote: "孩子在游戏中，最能靠近自己的创造力。",
    source: "D. W. Winnicott《Playing and Reality》（短句意译）",
    reflection: "把目标放小一点，让孩子先在游戏里表达自己。"
  },
  {
    quote: "孩子不是明天的人，孩子就是今天的人。",
    source: "Janusz Korczak（短句意译）",
    reflection: "今天认真听孩子说完一件小事。"
  },
  {
    quote: "陪伴不是把时间填满，而是让孩子感到被看见。",
    source: "饭米粒Love 陪伴笔记",
    reflection: "今天只抓住一个真实瞬间，回应孩子的感受。"
  },
  {
    quote: "成长发生在重复的小事里。",
    source: "饭米粒Love 陪伴笔记",
    reflection: "把任务做小一点，更容易持续。"
  },
  {
    quote: "少一点催促，多一点一起开始。",
    source: "饭米粒Love 陪伴笔记",
    reflection: "先陪孩子启动，再慢慢退出。"
  },
  {
    quote: "记录不是打分，是把生命力留下来。",
    source: "饭米粒Love 陪伴笔记",
    reflection: "写下一句具体观察，比评价更有用。"
  },
  {
    quote: "孩子需要的不是完美安排，而是稳定回应。",
    source: "饭米粒Love 陪伴笔记",
    reflection: "今天先完成一个低压力行动。"
  }
];

const roleLabels = {
  father: "爸爸",
  mother: "妈妈",
  family: "家庭",
  child: "孩子"
};

const roleClasses = {
  father: "role-father",
  mother: "role-mother",
  family: "role-family",
  child: "role-family"
};

function formatTask(task) {
  return {
    id: task.id,
    role: roleLabels[task.assignee_type] || "家庭",
    roleClass: roleClasses[task.assignee_type] || "role-family",
    title: task.title,
    progress: `${task.completed_count}/${task.planned_count}`
  };
}

function isFreshCache(savedAt, ttlMs = dashboardCacheRefreshMs) {
  return Boolean(savedAt && Date.now() - savedAt <= ttlMs);
}

function canDisplayCache(savedAt, ttlMs = dashboardCacheDisplayMs) {
  return Boolean(savedAt && Date.now() - savedAt <= ttlMs);
}

function getDailyQuote(referenceDate = new Date()) {
  const dayIndex = Math.floor(referenceDate.getTime() / (24 * 60 * 60 * 1000));
  return dailyQuotes[dayIndex % dailyQuotes.length];
}

function formatWeeklyPlanTask(task) {
  return {
    id: task.id,
    title: task.title,
    progress: `${task.completed_count}/${task.planned_count}`,
    completedCount: task.completed_count,
    plannedCount: task.planned_count,
    note: task.status === "completed" ? "已完成" : "慢慢来，不需要补任务"
  };
}

function formatWeeklyPlanCache(plan) {
  if (!plan) {
    return null;
  }

  const grouped = plan.groupedTasks || {};
  return {
    theme: plan.theme,
    weekendActivity: plan.weekend_activity || "留一个轻松的家庭陪伴时刻。",
    fatherTasks: (grouped.father || []).map(formatWeeklyPlanTask),
    motherTasks: (grouped.mother || []).map(formatWeeklyPlanTask),
    familyTasks: (grouped.family || []).map(formatWeeklyPlanTask),
    childTasks: (grouped.child || []).map(formatWeeklyPlanTask)
  };
}

function formatDateTimeLabel(value, fallbackDate) {
  const date = value ? new Date(value) : fallbackDate ? new Date(`${fallbackDate}T00:00:00`) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return fallbackDate || "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatGrowthRecordCache(record) {
  const tags = record.tags && record.tags.length ? record.tags : ["成长瞬间"];
  return {
    id: record.id,
    date: record.happened_on,
    happenedAt: record.happened_at || "",
    dateTimeLabel: formatDateTimeLabel(record.happened_at, record.happened_on),
    createdAt: record.created_at || "",
    title: tags[0],
    text: record.text,
    tags,
    photoUrls: (record.growth_record_media || [])
      .filter((media) => media.media_type === "photo" && media.signed_url)
      .map((media) => media.signed_url),
    shareImageUrl: ""
  };
}

Page({
  data: {
    isLoading: false,
    hasDashboardData: false,
    setupRequired: false,
    errorMessage: "",
    childNickname: "",
    dailyQuote: getDailyQuote(),
    weeklyTheme: "",
    taskCount: "",
    todayAction: {
      title: "",
      context: "",
      minutes: "",
      why: ""
    },
    tasks: []
  },
  onShow() {
    this.hydrateChildProfileCache();
    const usedCache = this.hydrateDashboardCache();
    this.loadDashboard({ useLoadingState: !usedCache, skipIfFresh: usedCache });
  },
  hydrateChildProfileCache() {
    const cached = wx.getStorageSync(childProfileCacheStorageKey);

    if (!cached || !cached.nickname || this.data.childNickname) {
      return;
    }

    this.setData({ childNickname: cached.nickname });
  },
  hydrateDashboardCache() {
    const cached = wx.getStorageSync(dashboardCacheStorageKey);

    if (!cached || !cached.savedAt || !cached.dashboard) {
      return false;
    }

    if (!canDisplayCache(cached.savedAt)) {
      return false;
    }

    this.applyDashboard(cached.dashboard);
    return true;
  },
  applyDashboard(dashboard) {
    const tasks = (dashboard.todayTasks || []).map(formatTask);
    const weeklyTheme = dashboard.weeklyPlan ? dashboard.weeklyPlan.theme : "轻松陪伴";
    if (dashboard.child && dashboard.child.nickname) {
      wx.setStorageSync(childProfileCacheStorageKey, {
        nickname: dashboard.child.nickname,
        savedAt: Date.now()
      });
    }

    this.setData({
      isLoading: false,
      hasDashboardData: true,
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
  },
  loadDashboard(options) {
    if (options && options.skipIfFresh) {
      const cached = wx.getStorageSync(dashboardCacheStorageKey);
      if (isFreshCache(cached && cached.savedAt)) {
        return;
      }
    }

    if (!options || options.useLoadingState !== false) {
      this.setData({ isLoading: true, errorMessage: "" });
    }

    getJson("/api/dashboard")
      .then((dashboard) => {
        wx.setStorageSync(dashboardCacheStorageKey, {
          savedAt: Date.now(),
          dashboard
        });
        this.applyDashboard(dashboard);
        this.warmTabCaches();
      })
      .catch((error) => {
        if (error.statusCode === 409) {
          this.setData({
            isLoading: false,
            hasDashboardData: false,
            setupRequired: true,
            errorMessage: "还没有创建家庭成长系统"
          });
          return;
        }

        this.setData({
          isLoading: false,
          errorMessage: error.error || "首页数据暂时无法同步"
        });
      });
  },
  warmTabCaches() {
    const weeklyPlanCache = wx.getStorageSync(weeklyPlanCacheStorageKey);
    if (!isFreshCache(weeklyPlanCache && weeklyPlanCache.savedAt)) {
      getJson("/api/weekly-plan/current")
        .then((response) => {
          const weeklyPlan = formatWeeklyPlanCache(response.weeklyPlan);
          if (!weeklyPlan) {
            return;
          }

          wx.setStorageSync(weeklyPlanCacheStorageKey, {
            savedAt: Date.now(),
            weeklyPlan
          });
        })
        .catch(() => {});
    }

    const growthRecordsCache = wx.getStorageSync(growthRecordsCacheStorageKey);
    if (!isFreshCache(growthRecordsCache && growthRecordsCache.savedAt)) {
      getJson("/api/growth-records")
        .then((response) => {
          wx.setStorageSync(growthRecordsCacheStorageKey, {
            savedAt: Date.now(),
            records: (response.records || []).map(formatGrowthRecordCache)
          });
        })
        .catch(() => {});
    }
  },
  startAction() {
    if (this.data.setupRequired) {
      wx.navigateTo({ url: "/pages/setup/index" });
      return;
    }
    const draftText = `${this.data.todayAction.title}。${this.data.todayAction.context}`;
    wx.setStorageSync(growthRecordPrefillStorageKey, {
      text: draftText,
      tags: this.data.weeklyTheme ? `${this.data.weeklyTheme},成长瞬间` : "成长瞬间"
    });
    wx.switchTab({ url: "/pages/archive/index" });
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
