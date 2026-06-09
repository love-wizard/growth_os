/* global Page, wx */
Page({
  data: {
    records: [
      {
        date: "2026-06-09",
        title: "主动阅读10分钟",
        text: "睡前自己选了一本绘本，愿意和妈妈轮流讲。",
        tags: ["阅读", "表达"]
      },
      {
        date: "2026-06-08",
        title: "第一次游过25米",
        text: "虽然有点紧张，但最后坚持游到了终点。",
        tags: ["游泳", "勇气"]
      }
    ]
  },
  addRecord() {
    wx.showToast({ title: "记录入口待接入", icon: "none" });
  }
});
