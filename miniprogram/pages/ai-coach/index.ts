Page({
  data: {
    prompts: [
      "孩子不想练琴怎么办？",
      "今晚只有30分钟",
      "如何恢复阅读？",
      "英语启蒙怎么开始？",
      "最近成长情况如何？",
      "本周末适合做什么？"
    ],
    selectedPrompt: "今晚只有30分钟",
    answer: {
      title: "今晚可以做：绘本找宝藏",
      text: "结合小钟最近的阅读目标，先做一个10-15分钟的亲子共读小游戏。让孩子选一本书，你负责读，他负责找画面里的一个小线索。",
      fallback: "如果孩子不想读，就只看图讲一个喜欢的角色，也算完成陪伴。"
    }
  },
  selectPrompt(event: { currentTarget: { dataset: { prompt: string } } }) {
    this.setData({ selectedPrompt: event.currentTarget.dataset.prompt });
  },
  askCoach() {
    wx.showToast({ title: "AI接口待接入", icon: "none" });
  }
});
