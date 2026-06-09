Page({
  data: {
    child: {
      nickname: "小钟",
      age: "5岁",
      goals: ["阅读习惯", "英语启蒙", "保持钢琴兴趣"]
    },
    reminders: [
      { title: "晚上陪伴提醒", enabled: true },
      { title: "周末活动提醒", enabled: false },
      { title: "周计划重置提醒", enabled: true }
    ]
  },
  openInvite() {
    wx.navigateTo({ url: "/pages/invite/index" });
  }
});
