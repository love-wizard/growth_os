import { hasMiniProgramSession, loginWithWeChat, logoutMiniProgram } from "../../services/session";

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
    void loginWithWeChat().then((result) => {
      if (result.requiresBackend) {
        const status =
          result.errorStage === "wx.login"
            ? "微信登录超时，请检查开发者工具账号和网络"
            : "微信登录已获取，后端登录失败";
        this.setData({
          isLoggedIn: false,
          loginStatus: status
        });
        console.warn("GrowthOS mini program login failed", result);
        wx.showToast({ title: "登录失败", icon: "none" });
        return;
      }

      this.setData({
        isLoggedIn: true,
        loginStatus: "微信身份已绑定"
      });
      wx.showToast({ title: "已登录", icon: "success" });
    }).catch((error) => {
      console.warn("GrowthOS mini program login unexpected error", error);
      this.setData({
        isLoggedIn: false,
        loginStatus: "登录失败，请稍后重试"
      });
      wx.showToast({ title: "登录失败", icon: "none" });
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
