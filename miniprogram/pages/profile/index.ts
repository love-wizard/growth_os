import { hasMiniProgramSession, loginWithWeChat, logoutMiniProgram } from "../../services/session";

const parentProfileStorageKey = "growth_os_parent_profile";

type ParentProfile = {
  avatarUrl?: string;
  nickname?: string;
};

function buildParentProfile(profile?: ParentProfile) {
  const nickname = profile?.nickname || "微信家长";
  return {
    avatarUrl: profile?.avatarUrl || "",
    nickname,
    nicknameInitial: nickname.slice(0, 1)
  };
}

function loadParentProfile() {
  return buildParentProfile(wx.getStorageSync(parentProfileStorageKey) as ParentProfile | undefined);
}

function persistParentProfile(profile: ParentProfile) {
  wx.setStorageSync(parentProfileStorageKey, {
    avatarUrl: profile.avatarUrl || "",
    nickname: profile.nickname || ""
  });
}

Page({
  data: {
    isLoggedIn: false,
    loginStatus: "微信身份还未绑定",
    parentProfile: buildParentProfile(),
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
    const isLoggedIn = hasMiniProgramSession();
    this.setData({
      isLoggedIn,
      loginStatus: isLoggedIn ? "微信身份已绑定" : "微信身份还未绑定",
      parentProfile: loadParentProfile()
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
        loginStatus: "微信身份已绑定",
        parentProfile: loadParentProfile()
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
  onChooseAvatar(event: { detail: { avatarUrl: string } }) {
    const parentProfile = buildParentProfile({
      ...this.data.parentProfile,
      avatarUrl: event.detail.avatarUrl
    });
    this.setData({ parentProfile });
    persistParentProfile(parentProfile);
  },
  onNicknameInput(event: { detail: { value: string } }) {
    const parentProfile = buildParentProfile({
      ...this.data.parentProfile,
      nickname: event.detail.value
    });
    this.setData({ parentProfile });
    persistParentProfile(parentProfile);
  },
  saveParentProfile() {
    persistParentProfile(this.data.parentProfile);
  },
  openInvite() {
    wx.navigateTo({ url: "/pages/invite/index" });
  },
  openSetup() {
    wx.navigateTo({ url: "/pages/setup/index" });
  }
});
