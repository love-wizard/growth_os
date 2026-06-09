/* global Page, wx */
const {
  hasMiniProgramSession,
  loginWithWeChat,
  logoutMiniProgram
} = require("../../services/session");
const { getJson, patchJson, uploadFile } = require("../../services/api");

const parentProfileStorageKey = "growth_os_parent_profile";
const reminderDefinitions = [
  {
    type: "evening_companionship",
    title: "晚上陪伴提醒",
    description: "只提醒留一点陪伴时间"
  },
  {
    type: "weekend_planning",
    title: "周末活动提醒",
    description: "周末前提醒安排一个轻量活动"
  },
  {
    type: "weekly_reset",
    title: "周计划重置提醒",
    description: "新的一周从一件最容易的小事开始"
  }
];

function buildParentProfile(profile) {
  const nickname = profile && profile.nickname ? profile.nickname : "微信家长";
  return {
    avatarUrl: profile && profile.avatarUrl ? profile.avatarUrl : "",
    nickname,
    nicknameInitial: nickname.slice(0, 1)
  };
}

function loadParentProfile() {
  return buildParentProfile(wx.getStorageSync(parentProfileStorageKey));
}

function persistParentProfile(profile) {
  wx.setStorageSync(parentProfileStorageKey, {
    avatarUrl: profile.avatarUrl || "",
    nickname: profile.nickname || ""
  });
}

function normalizeParentProfile(profile) {
  return buildParentProfile({
    avatarUrl: profile && profile.avatarUrl ? profile.avatarUrl : "",
    nickname: profile && profile.displayName ? profile.displayName : profile && profile.nickname ? profile.nickname : "微信家长"
  });
}

function calculateAge(birthDate) {
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

function buildReminders(preferences) {
  const byType = {};
  (preferences || []).forEach((item) => {
    byType[item.reminder_type] = item;
  });

  return reminderDefinitions.map((item) => ({
    type: item.type,
    title: item.title,
    description: item.description,
    enabled: Boolean(byType[item.type] && byType[item.type].enabled)
  }));
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
    reminders: buildReminders(),
    reminderStatus: ""
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
      this.loadReminderPreferences();
      this.loadParentProfile();
    }
  },
  loadParentProfile() {
    getJson("/api/me/profile")
      .then((response) => {
        const parentProfile = normalizeParentProfile(response.profile);
        this.setData({ parentProfile });
        persistParentProfile(parentProfile);
      })
      .catch(() => {});
  },
  loadFamilyProfile() {
    this.setData({ profileStatus: "", setupRequired: false });
    getJson("/api/dashboard")
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
  loadReminderPreferences() {
    this.setData({ reminderStatus: "" });
    getJson("/api/notification-preferences")
      .then((response) => {
        this.setData({
          reminders: buildReminders(response.preferences || []),
          reminderStatus: ""
        });
      })
      .catch((error) => {
        if (error.statusCode === 409) {
          this.setData({
            reminderStatus: "请先完成首次配置"
          });
          return;
        }

        this.setData({
          reminderStatus: error.error || "提醒设置加载失败"
        });
      });
  },
  login() {
    wx.showToast({ title: "正在登录", icon: "loading" });
    loginWithWeChat().then((result) => {
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
      this.loadReminderPreferences();
      this.loadParentProfile();
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
      },
      reminders: buildReminders(),
      reminderStatus: ""
    });
  },
  onChooseAvatar(event) {
    const previousProfile = this.data.parentProfile;
    const parentProfile = buildParentProfile({
      ...this.data.parentProfile,
      avatarUrl: event.detail.avatarUrl
    });
    this.setData({ parentProfile });
    persistParentProfile(parentProfile);

    if (!this.data.isLoggedIn) {
      return;
    }

    uploadFile("/api/me/profile/avatar", event.detail.avatarUrl, "file", {
      displayName: parentProfile.nickname
    })
      .then((response) => {
        const syncedProfile = normalizeParentProfile(response.profile);
        this.setData({ parentProfile: syncedProfile });
        persistParentProfile(syncedProfile);
      })
      .catch((error) => {
        this.setData({ parentProfile: previousProfile });
        persistParentProfile(previousProfile);
        wx.showToast({ title: error.error || "头像同步失败", icon: "none" });
      });
  },
  onNicknameInput(event) {
    const parentProfile = buildParentProfile({
      ...this.data.parentProfile,
      nickname: event.detail.value
    });
    this.setData({ parentProfile });
    persistParentProfile(parentProfile);
  },
  saveParentProfile() {
    persistParentProfile(this.data.parentProfile);

    if (!this.data.isLoggedIn) {
      return;
    }

    patchJson("/api/me/profile", {
      displayName: this.data.parentProfile.nickname
    })
      .then((response) => {
        const parentProfile = normalizeParentProfile(response.profile);
        this.setData({ parentProfile });
        persistParentProfile(parentProfile);
      })
      .catch((error) => {
        wx.showToast({ title: error.error || "昵称同步失败", icon: "none" });
      });
  },
  toggleReminder(event) {
    const reminderType = event.currentTarget.dataset.type;
    const enabled = event.detail.value;

    this.setData({
      reminders: this.data.reminders.map((item) =>
        item.type === reminderType ? { ...item, enabled } : item
      )
    });

    patchJson("/api/notification-preferences", {
      reminderType,
      enabled
    })
      .then(() => {
        wx.showToast({ title: enabled ? "已开启" : "已关闭", icon: "success" });
      })
      .catch((error) => {
        this.setData({
          reminders: this.data.reminders.map((item) =>
            item.type === reminderType ? { ...item, enabled: !enabled } : item
          ),
          reminderStatus: error.error || "提醒设置失败"
        });
        wx.showToast({ title: "设置失败", icon: "none" });
      });
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
