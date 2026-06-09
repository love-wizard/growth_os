/* global Page, wx */
const {
  hasMiniProgramSession,
  loginWithWeChat,
  logoutMiniProgram
} = require("../../services/session");

Page({
  data: {
    isLoggedIn: false,
    loginStatus: "微信身份还未绑定",
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
  onShow() {
    this.setData({
      isLoggedIn: hasMiniProgramSession(),
      loginStatus: hasMiniProgramSession() ? "微信身份已绑定" : "微信身份还未绑定"
    });
  },
  login() {
    wx.showToast({ title: "正在登录", icon: "loading" });
    loginWithWeChat().then((result) => {
      if (result.requiresBackend) {
        this.setData({
          isLoggedIn: false,
          loginStatus: "已获取微信授权，后端登录接口待接入"
        });
        wx.showToast({ title: "登录接口待接入", icon: "none" });
        return;
      }

      this.setData({
        isLoggedIn: true,
        loginStatus: "微信身份已绑定"
      });
      wx.showToast({ title: "已登录", icon: "success" });
    });
  },
  logout() {
    logoutMiniProgram();
    this.setData({
      isLoggedIn: false,
      loginStatus: "微信身份还未绑定"
    });
  },
  openInvite() {
    wx.navigateTo({ url: "/pages/invite/index" });
  },
  openSetup() {
    wx.navigateTo({ url: "/pages/setup/index" });
  }
});
