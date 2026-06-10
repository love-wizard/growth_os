/* global Page, wx */
const {
  getJson,
  isTimeoutRequestError,
  postJson,
  postJsonWithOptions
} = require("../../services/api");
const aiRequestTimeoutMs = 30000;

function inferMode(message) {
  if (/下周|生成.*周计划|周计划草案/.test(message)) {
    return "weekly_plan_draft";
  }

  if (/最近|一个月|成长情况|总结|报告/.test(message)) {
    return "growth_analysis";
  }

  if (/30分钟|活动|周末|今晚|玩什么/.test(message)) {
    return "activity_generation";
  }

  return "parenting_qa";
}

function formatCoachResponse(response) {
  if (!response) {
    return {
      contextLabel: "基于真实成长档案",
      title: "暂时没有生成建议",
      text: "可以换一个更具体的问题再试一次。",
      actions: [],
      fallback: "先做一件低压力的小事。",
      weeklyPlanDraftId: "",
      isWeeklyPlanDraft: false,
      isDraftConfirmed: false,
      confirmLabel: "",
      confirmHint: ""
    };
  }

  if (response.mode === "activity_generation") {
    return {
      contextLabel: "基于真实成长档案",
      title: response.activityName,
      text: `${response.estimatedMinutes}分钟。培养目标：${response.cultivationGoal}`,
      actions: response.steps || [],
      fallback: `所需物品：${(response.materials || []).join("、") || "不需要额外材料"}`,
      weeklyPlanDraftId: "",
      isWeeklyPlanDraft: false,
      isDraftConfirmed: false,
      confirmLabel: "",
      confirmHint: ""
    };
  }

  if (response.mode === "growth_analysis") {
    return {
      contextLabel: "基于最近成长记录",
      title: response.title,
      text: (response.sections || [])
        .map((section) => `${section.area}：${section.summary}`)
        .join("\n"),
      actions: response.nextActions || [],
      fallback: "成长分析会随着记录增加而更贴合孩子。",
      weeklyPlanDraftId: "",
      isWeeklyPlanDraft: false,
      isDraftConfirmed: false,
      confirmLabel: "",
      confirmHint: ""
    };
  }

  if (response.mode === "weekly_plan_draft") {
    return {
      contextLabel: "基于真实成长档案，确认后下周生效",
      title: response.theme,
      text: `阅读：${response.readingRecommendation}\n英语：${response.englishRecommendation}`,
      actions: [
        ...(response.fatherTasks || []).map((task) => `爸爸：${task.title} ${task.plannedCount}次`),
        ...(response.motherTasks || []).map((task) => `妈妈：${task.title} ${task.plannedCount}次`),
        ...(response.childTasks || []).map((task) => `孩子：${task.title} ${task.plannedCount}次`)
      ],
      fallback: response.weekendActivity,
      weeklyPlanDraftId: "",
      isWeeklyPlanDraft: true,
      isDraftConfirmed: false,
      confirmLabel: "采用这份下周计划",
      confirmHint: "家长确认后会写入下周计划，不会覆盖本周安排。"
    };
  }

  return {
    contextLabel: "基于真实成长档案",
    title: response.title,
    text: response.summary,
    actions: response.actions || response.analysis || [],
    fallback: response.followUpQuestion || "如果孩子抗拒，先把任务缩小到5分钟。",
    weeklyPlanDraftId: "",
    isWeeklyPlanDraft: false,
    isDraftConfirmed: false,
    confirmLabel: "",
    confirmHint: ""
  };
}

function getModeLabel(mode) {
  if (mode === "weekly_plan_draft") {
    return "下周计划";
  }

  if (mode === "growth_analysis") {
    return "成长分析";
  }

  if (mode === "activity_generation") {
    return "亲子活动";
  }

  return "育儿问答";
}

function summarizeCoachResponse(response) {
  if (!response) {
    return "还没有生成有效建议";
  }

  if (response.mode === "weekly_plan_draft") {
    return response.theme || "下周计划草案";
  }

  if (response.mode === "growth_analysis") {
    return response.title || "最近成长情况";
  }

  if (response.mode === "activity_generation") {
    return response.activityName || "亲子活动建议";
  }

  return response.title || "育儿建议";
}

function formatHistoryTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

function buildHistoryItem(conversation) {
  const activeDraft = (conversation.ai_weekly_plan_drafts || []).find(
    (item) => item.status === "draft"
  );
  const answer = formatCoachResponse(conversation.response);

  return {
    id: conversation.id,
    modeLabel: getModeLabel(conversation.mode),
    message: conversation.message,
    title: summarizeCoachResponse(conversation.response),
    createdAtLabel: formatHistoryTime(conversation.created_at),
    answer: {
      ...answer,
      weeklyPlanDraftId:
        answer.isWeeklyPlanDraft && activeDraft ? activeDraft.id : answer.weeklyPlanDraftId
    }
  };
}

Page({
  data: {
    isLoading: false,
    isHistoryLoading: false,
    errorMessage: "",
    prompts: [
      "孩子不想练琴怎么办？",
      "今晚只有30分钟",
      "帮我生成下周计划",
      "如何恢复阅读？",
      "英语启蒙怎么开始？",
      "最近成长情况如何？",
      "本周末适合做什么？"
    ],
    selectedPrompt: "今晚只有30分钟",
    freeQuestion: "",
    history: [],
    answer: {
      contextLabel: "基于真实成长档案",
      title: "今晚可以做：绘本找宝藏",
      text: "结合孩子最近的成长目标，先做一个10-15分钟的亲子共读小游戏。让孩子选一本书，你负责读，他负责找一个画面里的小线索。",
      actions: ["孩子选一本书", "家长读一页", "孩子找一个画面线索"],
      fallback: "如果孩子不想读，就只看图讲一个喜欢的角色，也算完成陪伴。",
      weeklyPlanDraftId: "",
      isWeeklyPlanDraft: false,
      isDraftConfirmed: false,
      confirmLabel: "",
      confirmHint: ""
    }
  },
  onShow() {
    this.loadHistory();
  },
  selectPrompt(event) {
    this.setData({ selectedPrompt: event.currentTarget.dataset.prompt, freeQuestion: "" });
  },
  onQuestionInput(event) {
    this.setData({ freeQuestion: event.detail.value });
  },
  askCoach() {
    const message = this.data.freeQuestion || this.data.selectedPrompt;
    if (!message) {
      wx.showToast({ title: "请输入问题", icon: "none" });
      return;
    }

    this.setData({ isLoading: true, errorMessage: "" });
    postJsonWithOptions("/api/ai/coach", {
      mode: inferMode(message),
      message
    }, {
      timeoutMs: aiRequestTimeoutMs
    })
      .then((result) => {
        const answer = formatCoachResponse(result.response);
        const historyItem = buildHistoryItem({
          id: result.conversationId || `${Date.now()}`,
          mode: inferMode(message),
          message,
          response: result.response,
          created_at: new Date().toISOString(),
          ai_weekly_plan_drafts: result.weeklyPlanDraftId
            ? [{ id: result.weeklyPlanDraftId, status: "draft" }]
            : []
        });
        this.setData({
          isLoading: false,
          history: [historyItem, ...this.data.history.filter((item) => item.id !== historyItem.id)].slice(
            0,
            8
          ),
          answer: {
            ...answer,
            weeklyPlanDraftId:
              answer.isWeeklyPlanDraft && result.weeklyPlanDraftId ? result.weeklyPlanDraftId : ""
          }
        });
      })
      .catch((error) => {
        const errorMessage = isTimeoutRequestError(error)
          ? "这次思考稍久，已超过等待时间，请再试一次。"
          : error.statusCode === 409
            ? "请先完成首次配置，再使用AI教练"
            : error.error || "AI教练暂时不可用";
        this.setData({
          isLoading: false,
          errorMessage
        });
      });
  },
  confirmWeeklyPlanDraft() {
    const draftId = this.data.answer.weeklyPlanDraftId;
    if (!draftId || this.data.answer.isDraftConfirmed) {
      return;
    }

    this.setData({ isLoading: true, errorMessage: "" });
    postJson(`/api/ai/weekly-plan-drafts/${draftId}/confirm`, {})
      .then(() => {
        wx.showToast({ title: "已采用，下周生效", icon: "success" });
        this.setData({
          isLoading: false,
          answer: {
            ...this.data.answer,
            isDraftConfirmed: true,
            confirmLabel: "已采用",
            confirmHint: "这份草案已经保存为下周计划。"
          }
        });
      })
      .catch((error) => {
        const errorMessage = isTimeoutRequestError(error)
          ? "采用草案时等待超时，请再试一次。"
          : error.error || "采用计划失败";
        this.setData({
          isLoading: false,
          errorMessage
        });
      });
  },
  loadHistory() {
    this.setData({ isHistoryLoading: true });
    getJson("/api/ai/conversations")
      .then((result) => {
        this.setData({
          isHistoryLoading: false,
          history: (result.conversations || []).map(buildHistoryItem)
        });
      })
      .catch(() => {
        this.setData({ isHistoryLoading: false });
      });
  },
  openHistoryItem(event) {
    const conversationId = event.currentTarget.dataset.conversationId;
    const historyItem = this.data.history.find((item) => item.id === conversationId);

    if (!historyItem) {
      return;
    }

    this.setData({
      answer: historyItem.answer,
      errorMessage: ""
    });
  }
});
