import { hasMiniProgramSession, loginWithWeChat, logoutMiniProgram } from "../../services/session";
import { getJson } from "../../services/api";

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

function calculateAge(birthDate?: string) {
  if (!birthDate) {
    return "";
  }

  const birth = new Date(`${birthDate}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }

  return `${Math.max(age, 0)}岁`;
}

Page({
  data: {
    isLoggedIn: false,
    loginStatus: "微信身份还未绑定",
    profileStatus: "",
    setupRequired: false,
    parentProfile: buildParentProfile(),
    child: {
      nickname: "还未创建孩子档案",
      age: "",
      goals: []
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
    if (isLoggedIn) {
      this.loadFamilyProfile();
    }
  },
  loadFamilyProfile() {
    this.setData({ profileStatus: "", setupRequired: false });
    void getJson<{
      child: { nickname: string; birth_date: string } | null;
      annualGoals: Array<{ title: string }>;
    }>("/api/dashboard")
      .then((dashboard) => {
        this.setData({
          child: {
            nickname: dashboard.child ? dashboard.child.nickname : "还未创建孩子档案",
            age: dashboard.child ? calculateAge(dashboard.child.birth_date) : "",
            goals: (dashboard.annualGoals || []).map((goal) => goal.title)
          },
          setupRequired: !dashboard.child,
          profileStatus: ""
        });
      })
      .catch((error) => {
        if (error.statusCode === 409) {
          this.setData({
            setupRequired: true,
            profileStatus: "还没有创建家庭成长系统",
            child: {
              nickname: "还未创建孩子档案",
              age: "",
              goals: []
            }
          });
          return;
        }

        this.setData({
          profileStatus: error.error || "家庭资料加载失败"
        });
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
        const detail = result.errorMessage ? `：${result.errorMessage}` : "";
        this.setData({
          isLoggedIn: false,
          loginStatus: `${status}${detail}`
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
      this.loadFamilyProfile();
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
      loginStatus: "微信身份还未绑定",
      setupRequired: false,
      profileStatus: "",
      child: {
        nickname: "还未创建孩子档案",
        age: "",
        goals: []
      }
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
  openInterests() {
    wx.navigateTo({ url: "/pages/interests/index" });
  },
  openSetup() {
    wx.navigateTo({ url: "/pages/setup/index" });
  }
});
