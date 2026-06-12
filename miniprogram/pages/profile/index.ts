import { hasMiniProgramSession, loginWithWeChat, logoutMiniProgram } from "../../services/session";
import { getActiveChildId, getJson, patchJson, setActiveChildId, uploadFile } from "../../services/api";

const parentProfileStorageKey = "growth_os_parent_profile";
const localTestStorageKeys = [
  "growth_os_onboarding_guide_seen",
  "growth_os_child_profile_cache",
  "growth_os_dashboard_cache",
  "growth_os_weekly_plan_cache",
  "growth_os_growth_records_cache_v3",
  "growth_os_active_child_id",
  "growth_os_growth_record_prefill",
  "growth_os_ai_coach_prefill"
];
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
] as const;

type ParentProfile = {
  avatarUrl?: string;
  nickname?: string;
};

type FamilyChild = {
  id: string;
  name?: string;
  nickname: string;
  birth_date?: string;
  gender?: string;
  profile_color?: string;
};

const childColorOptions = ["#E7F3EC", "#F6E7D8", "#E8EEF9", "#F5E6EA", "#F2EDD8"];

function clearChildScopedCaches() {
  [
    "growth_os_child_profile_cache",
    "growth_os_dashboard_cache",
    "growth_os_weekly_plan_cache",
    "growth_os_growth_records_cache_v3"
  ].forEach((key) => wx.removeStorageSync(key));
}

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

function normalizeParentProfile(profile?: {
  avatarUrl?: string;
  displayName?: string;
  nickname?: string;
}) {
  return buildParentProfile({
    avatarUrl: profile?.avatarUrl || "",
    nickname: profile?.displayName || profile?.nickname || "微信家长"
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

function getGenderLabel(gender?: string) {
  if (gender === "male") {
    return "男孩";
  }

  if (gender === "female") {
    return "女孩";
  }

  return "未填性别";
}

function buildChildCards(children?: FamilyChild[], activeChildId?: string) {
  return (children || []).map((child) => ({
    id: child.id,
    name: child.name || child.nickname,
    nickname: child.nickname,
    birthDate: child.birth_date || "",
    gender: child.gender || "",
    genderLabel: getGenderLabel(child.gender),
    profileColor: child.profile_color || childColorOptions[0],
    age: calculateAge(child.birth_date),
    initial: child.nickname.slice(0, 1),
    selected: child.id === activeChildId
  }));
}

function buildReminders(
  preferences?: Array<{
    reminder_type: string;
    enabled: boolean;
  }>
) {
  const byType = new Map((preferences || []).map((item) => [item.reminder_type, item]));

  return reminderDefinitions.map((item) => ({
    type: item.type,
    title: item.title,
    description: item.description,
    enabled: Boolean(byType.get(item.type)?.enabled)
  }));
}

function shouldShowDevTools() {
  try {
    const accountInfo = wx.getAccountInfoSync();
    return accountInfo.miniProgram.envVersion !== "release";
  } catch {
    return false;
  }
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
    children: [] as Array<{
      id: string;
      name: string;
      nickname: string;
      birthDate: string;
      gender: string;
      genderLabel: string;
      profileColor: string;
      age: string;
      initial: string;
      selected: boolean;
    }>,
    isChildEditorOpen: false,
    isSavingChild: false,
    childColorOptions,
    editingChildId: "",
    editingChildName: "",
    editingChildNickname: "",
    editingChildBirthDate: "",
    editingChildGender: "",
    editingChildColor: childColorOptions[0],
    reminders: buildReminders(),
    reminderStatus: "",
    showDevTools: false
  },
  onShow() {
    const isLoggedIn = hasMiniProgramSession();
    this.setData({
      isLoggedIn,
      loginStatus: isLoggedIn ? "微信身份已绑定" : "微信身份还未绑定",
      parentProfile: loadParentProfile(),
      showDevTools: shouldShowDevTools()
    });
    if (isLoggedIn) {
      this.loadFamilyProfile();
      this.loadReminderPreferences();
      this.loadParentProfile();
    }
  },
  loadParentProfile() {
    void getJson<{
      profile: {
        displayName: string;
        avatarUrl: string;
      };
    }>("/api/me/profile")
      .then((response) => {
        const parentProfile = normalizeParentProfile(response.profile);
        this.setData({ parentProfile });
        persistParentProfile(parentProfile);
      })
      .catch(() => {});
  },
  loadFamilyProfile() {
    this.setData({ profileStatus: "", setupRequired: false });
    void getJson<{
      child: { id: string; nickname: string; birth_date: string } | null;
      children?: FamilyChild[];
      annualGoals: Array<{ title: string }>;
    }>("/api/dashboard")
      .then((dashboard) => {
        const activeChildId = dashboard.child?.id || getActiveChildId() || dashboard.children?.[0]?.id || "";
        if (activeChildId) {
          setActiveChildId(activeChildId);
        }
        this.setData({
          child: {
            nickname: dashboard.child ? dashboard.child.nickname : "还未创建孩子档案",
            age: dashboard.child ? calculateAge(dashboard.child.birth_date) : "",
            goals: (dashboard.annualGoals || []).map((goal) => goal.title)
          },
          children: buildChildCards(dashboard.children, activeChildId),
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
            },
            children: []
          });
          return;
        }

        this.setData({
          profileStatus: error.error || "家庭资料暂时无法同步"
        });
      });
  },
  loadReminderPreferences() {
    this.setData({ reminderStatus: "" });
    void getJson<{
      preferences: Array<{
        reminder_type: string;
        enabled: boolean;
      }>;
    }>("/api/notification-preferences")
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
          reminderStatus: error.error || "提醒设置暂时无法同步"
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
            : "微信登录已获取，服务端登录未成功";
        const detail = result.errorMessage ? `：${result.errorMessage}` : "";
        this.setData({
          isLoggedIn: false,
          loginStatus: `${status}${detail}`
        });
        console.warn("GrowthOS mini program login failed", result);
        wx.showToast({ title: "登录未成功", icon: "none" });
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
        loginStatus: "登录未成功，请稍后重试"
      });
      wx.showToast({ title: "登录未成功", icon: "none" });
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
      children: [],
      reminders: buildReminders(),
      reminderStatus: ""
    });
  },
  onChooseAvatar(event: { detail: { avatarUrl: string } }) {
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

    void uploadFile<{
      profile: {
        displayName: string;
        avatarUrl: string;
      };
    }>("/api/me/profile/avatar", event.detail.avatarUrl, "file", {
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
        wx.showToast({ title: error.error || "头像同步未成功", icon: "none" });
      });
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

    if (!this.data.isLoggedIn) {
      return;
    }

    void patchJson<{
      profile: {
        displayName: string;
        avatarUrl: string;
      };
    }>("/api/me/profile", {
      displayName: this.data.parentProfile.nickname
    })
      .then((response) => {
        const parentProfile = normalizeParentProfile(response.profile);
        this.setData({ parentProfile });
        persistParentProfile(parentProfile);
      })
      .catch((error) => {
        wx.showToast({ title: error.error || "昵称同步未成功", icon: "none" });
      });
  },
  toggleReminder(event: { currentTarget: { dataset: { type: string } }; detail: { value: boolean } }) {
    const reminderType = event.currentTarget.dataset.type;
    const enabled = event.detail.value;

    this.setData({
      reminders: this.data.reminders.map((item: {
        type: string;
        title: string;
        description: string;
        enabled: boolean;
      }) =>
        item.type === reminderType ? { ...item, enabled } : item
      )
    });

    void patchJson("/api/notification-preferences", {
      reminderType,
      enabled
    })
      .then(() => {
        wx.showToast({ title: enabled ? "已开启" : "已关闭", icon: "success" });
      })
      .catch((error) => {
        this.setData({
          reminders: this.data.reminders.map((item: {
            type: string;
            title: string;
            description: string;
            enabled: boolean;
          }) =>
            item.type === reminderType ? { ...item, enabled: !enabled } : item
          ),
          reminderStatus: error.error || "提醒设置未成功"
        });
        wx.showToast({ title: "设置未成功", icon: "none" });
      });
  },
  openInvite() {
    wx.navigateTo({ url: "/pages/invite/index" });
  },
  openInterests() {
    wx.navigateTo({ url: "/pages/interests/index" });
  },
  switchChild(event: { currentTarget: { dataset: { id?: string } } }) {
    const childId = event.currentTarget.dataset.id;
    if (!childId || childId === getActiveChildId()) {
      return;
    }

    setActiveChildId(childId);
    clearChildScopedCaches();
    this.setData({
      children: this.data.children.map((child: { id: string }) => ({
        ...child,
        selected: child.id === childId
      })),
      profileStatus: "已设为默认孩子"
    });
    this.loadFamilyProfile();
  },
  openChildEditor(event: { currentTarget: { dataset: { id?: string } } }) {
    const childId = event.currentTarget.dataset.id;
    const child = this.data.children.find((item: { id: string }) => item.id === childId);
    if (!child) {
      return;
    }

    this.setData({
      isChildEditorOpen: true,
      editingChildId: child.id,
      editingChildName: child.name,
      editingChildNickname: child.nickname,
      editingChildBirthDate: child.birthDate,
      editingChildGender: child.gender,
      editingChildColor: child.profileColor || childColorOptions[0],
      profileStatus: ""
    });
  },
  closeChildEditor() {
    if (this.data.isSavingChild) {
      return;
    }

    this.setData({ isChildEditorOpen: false });
  },
  noop() {},
  onChildNameInput(event: { detail: { value: string } }) {
    this.setData({ editingChildName: event.detail.value });
  },
  onChildNicknameInput(event: { detail: { value: string } }) {
    this.setData({ editingChildNickname: event.detail.value });
  },
  onChildBirthDateChange(event: { detail: { value: string } }) {
    this.setData({ editingChildBirthDate: event.detail.value });
  },
  chooseChildGender(event: { currentTarget: { dataset: { value?: string } } }) {
    this.setData({ editingChildGender: event.currentTarget.dataset.value || "" });
  },
  chooseChildColor(event: { currentTarget: { dataset: { color?: string } } }) {
    this.setData({ editingChildColor: event.currentTarget.dataset.color || childColorOptions[0] });
  },
  saveChildProfile() {
    const childId = this.data.editingChildId;
    const name = this.data.editingChildName.trim();
    const nickname = this.data.editingChildNickname.trim();
    if (!childId || !name || !nickname || !this.data.editingChildBirthDate || !this.data.editingChildGender) {
      wx.showToast({ title: "请补全孩子信息", icon: "none" });
      return;
    }

    this.setData({ isSavingChild: true });
    void patchJson<{ child: FamilyChild }>(`/api/children/${childId}`, {
      name,
      nickname,
      birthDate: this.data.editingChildBirthDate,
      gender: this.data.editingChildGender,
      profileColor: this.data.editingChildColor
    })
      .then(() => {
        wx.showToast({ title: "已保存", icon: "success" });
        clearChildScopedCaches();
        this.setData({
          isSavingChild: false,
          isChildEditorOpen: false,
          profileStatus: "孩子档案已更新"
        });
        this.loadFamilyProfile();
      })
      .catch((error) => {
        this.setData({ isSavingChild: false });
        wx.showToast({ title: error.error || "保存未成功", icon: "none" });
      });
  },
  openSetup() {
    wx.navigateTo({ url: "/pages/setup/index" });
  },
  resetLocalOnboardingState() {
    localTestStorageKeys.forEach((key) => wx.removeStorageSync(key));
    this.setData({
      setupRequired: false,
      profileStatus: "本机引导和页面缓存已清除，服务端家庭数据不受影响。",
      child: {
        nickname: "还未创建孩子档案",
        age: "",
        goals: []
      }
    });
    wx.showToast({ title: "已清本机缓存", icon: "success" });
    wx.redirectTo({ url: "/pages/first-guidance/index" });
  }
});
