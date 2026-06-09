Page({
  data: {
    childNickname: "小钟",
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
  startAction() {
    wx.showToast({ title: "已开始陪伴", icon: "success" });
  },
  openCoach() {
    wx.switchTab({ url: "/pages/ai-coach/index" });
  },
  openArchive() {
    wx.switchTab({ url: "/pages/archive/index" });
  }
});
