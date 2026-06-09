Page({
  data: {
    theme: "建立阅读习惯",
    fatherTasks: [
      { title: "一次户外运动或探索", progress: "0/1", note: "可以在饭后散步时完成" },
      { title: "周末一起观察一种植物", progress: "未开始", note: "不需要额外采购材料" }
    ],
    motherTasks: [
      { title: "三次亲子阅读", progress: "1/3", note: "每次10分钟即可" },
      { title: "一次英文儿歌输入", progress: "0/1", note: "保持轻松，不要求跟读" }
    ],
    familyTasks: [{ title: "睡前说一个今天喜欢的瞬间", progress: "0/2", note: "帮助情绪表达" }]
  },
  completeTask(event: { currentTarget: { dataset: { title: string } } }) {
    wx.showToast({ title: `${event.currentTarget.dataset.title} +1`, icon: "success" });
  }
});
