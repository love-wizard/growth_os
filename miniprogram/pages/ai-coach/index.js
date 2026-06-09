/* global Page, wx */
const { postJson } = require("../../services/api");

function inferMode(message) {
  if (/周计划|下周|本周任务/.test(message)) {
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
      title: "暂时没有生成建议",
      text: "可以换一个更具体的问题再试一次。",
      actions: [],
      fallback: "先做一件低压力的小事。"
    };
  }

  if (response.mode === "activity_generation") {
    return {
      title: response.activityName,
      text: `${response.estimatedMinutes}分钟。培养目标：${response.cultivationGoal}`,
      actions: response.steps || [],
      fallback: `所需物品：${(response.materials || []).join("、") || "不需要额外材料"}`
    };
  }

  if (response.mode === "growth_analysis") {
    return {
      title: response.title,
      text: (response.sections || [])
        .map((section) => `${section.area}：${section.summary}`)
        .join("\n"),
      actions: response.nextActions || [],
      fallback: "成长分析会随着记录增加而更贴合孩子。"
    };
  }

  if (response.mode === "weekly_plan_draft") {
    return {
      title: response.theme,
      text: `阅读：${response.readingRecommendation}\n英语：${response.englishRecommendation}`,
      actions: [
        ...(response.fatherTasks || []).map((task) => `爸爸：${task.title} ${task.plannedCount}次`),
        ...(response.motherTasks || []).map((task) => `妈妈：${task.title} ${task.plannedCount}次`),
        ...(response.childTasks || []).map((task) => `孩子：${task.title} ${task.plannedCount}次`)
      ],
      fallback: response.weekendActivity
    };
  }

  return {
    title: response.title,
    text: response.summary,
    actions: response.actions || response.analysis || [],
    fallback: response.followUpQuestion || "如果孩子抗拒，先把任务缩小到5分钟。"
  };
}

Page({
  data: {
    isLoading: false,
    errorMessage: "",
    prompts: [
      "孩子不想练琴怎么办？",
      "今晚只有30分钟",
      "如何恢复阅读？",
      "英语启蒙怎么开始？",
      "最近成长情况如何？",
      "本周末适合做什么？"
    ],
    selectedPrompt: "今晚只有30分钟",
    freeQuestion: "",
    answer: {
      title: "今晚可以做：绘本找宝藏",
      text: "结合小钟最近的阅读目标，先做一个10-15分钟的亲子共读小游戏。让孩子选一本书，你负责读，他负责找画面里的一个小线索。",
      actions: ["孩子选一本书", "家长读一页", "孩子找一个画面线索"],
      fallback: "如果孩子不想读，就只看图讲一个喜欢的角色，也算完成陪伴。"
    }
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
    postJson("/api/ai/coach", {
      mode: inferMode(message),
      message
    })
      .then((result) => {
        this.setData({
          isLoading: false,
          answer: formatCoachResponse(result.response)
        });
      })
      .catch((error) => {
        this.setData({
          isLoading: false,
          errorMessage:
            error.statusCode === 409 ? "请先完成首次配置，再使用AI教练" : error.error || "AI教练暂时不可用"
        });
      });
  }
});
