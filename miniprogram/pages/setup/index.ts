import { postJson, setActiveChildId } from "../../services/api";

const childProfileCacheStorageKey = "growth_os_child_profile_cache";
const dashboardCacheStorageKey = "growth_os_dashboard_cache";
const weeklyPlanCacheStorageKey = "growth_os_weekly_plan_cache";
const growthRecordsCacheStorageKey = "growth_os_growth_records_cache_v3";
const acceptedSuggestionStorageKey = "growth_os_accepted_suggestion_v1";

const focusOptions = [
  { label: "阅读习惯", value: "reading_habit", selected: true },
  { label: "英语启蒙", value: "english_exposure", selected: true },
  { label: "户外探索", value: "outdoor_exploration", selected: false },
  { label: "情绪表达", value: "emotional_expression", selected: false },
  { label: "钢琴兴趣", value: "music_or_piano_interest", selected: false },
  { label: "运动习惯", value: "physical_activity", selected: false }
];

const challengeOptions = [
  { label: "今晚只有30分钟", value: "limited_time_tonight" },
  { label: "阅读有点断", value: "reading_difficulty" },
  { label: "不想练琴", value: "interest_resistance" },
  { label: "周末不知道做什么", value: "weekend_activity_need" }
];

const traitOptions = [
  { label: "好奇", value: "curious", selected: true },
  { label: "敏感", value: "sensitive", selected: false },
  { label: "喜欢被鼓励", value: "likes_praise", selected: true },
  { label: "有主见", value: "strong_willed", selected: false },
  { label: "慢热", value: "slow_to_warm_up", selected: false },
  { label: "容易受挫", value: "easily_frustrated", selected: false }
];

const assigneeOptions = [
  { label: "爸爸", value: "father" },
  { label: "妈妈", value: "mother" },
  { label: "全家", value: "family" }
] as const;

type FirstGuidanceSuggestion = {
  title: string;
  childSpecificContext: string;
  likelyInterpretation: string;
  action: string;
  estimatedMinutes: number;
  whyItHelps: string;
  gentleFallback: string;
};

function getSelectedValues(
  options: Array<{ value: string; selected: boolean }>
) {
  return options.filter((item) => item.selected).map((item) => item.value);
}

Page({
  data: {
    step: 1,
    totalSteps: 4,
    isSubmitting: false,
    isGeneratingSuggestion: false,
    suggestionErrorMessage: "",
    nickname: "",
    birthDate: "",
    gender: "female",
    focusOptions,
    challengeOptions,
    traitOptions,
    assigneeOptions,
    selectedChallenge: "limited_time_tonight",
    selectedAssignee: "family",
    firstGuidanceSessionId: "",
    suggestion: null as FirstGuidanceSuggestion | null
  },
  nextStep() {
    if (this.data.step === 3) {
      this.generateSuggestion();
      return;
    }

    const next = Math.min(this.data.step + 1, this.data.totalSteps);
    this.setData({ step: next, suggestionErrorMessage: "" });
  },
  prevStep() {
    const prev = Math.max(this.data.step - 1, 1);
    this.setData({ step: prev, suggestionErrorMessage: "" });
  },
  onNicknameInput(event: { detail: { value: string } }) {
    this.setData({ nickname: event.detail.value });
  },
  onBirthDateChange(event: { detail: { value: string } }) {
    this.setData({ birthDate: event.detail.value });
  },
  chooseGender(event: { currentTarget: { dataset: { value: string } } }) {
    this.setData({ gender: event.currentTarget.dataset.value });
  },
  toggleFocus(event: { currentTarget: { dataset: { value: string } } }) {
    const value = event.currentTarget.dataset.value;
    const focusOptions = this.data.focusOptions.map(
      (item: { value: string; selected: boolean }) => {
        if (item.value !== value) {
          return item;
        }

        const selectedCount = getSelectedValues(this.data.focusOptions).length;
        if (!item.selected && selectedCount >= 3) {
          wx.showToast({ title: "最多选3个方向", icon: "none" });
          return item;
        }

        return { ...item, selected: !item.selected };
      }
    );
    this.setData({ focusOptions });
  },
  chooseChallenge(event: { currentTarget: { dataset: { value: string } } }) {
    this.setData({ selectedChallenge: event.currentTarget.dataset.value });
  },
  toggleTrait(event: { currentTarget: { dataset: { value: string } } }) {
    const value = event.currentTarget.dataset.value;
    const traitOptions = this.data.traitOptions.map(
      (item: { value: string; selected: boolean }) => {
        if (item.value !== value) {
          return item;
        }

        const selectedCount = getSelectedValues(this.data.traitOptions).length;
        if (!item.selected && selectedCount >= 3) {
          wx.showToast({ title: "最多选3个特质", icon: "none" });
          return item;
        }

        return { ...item, selected: !item.selected };
      }
    );
    this.setData({ traitOptions });
  },
  chooseAssignee(event: { currentTarget: { dataset: { value: string } } }) {
    this.setData({ selectedAssignee: event.currentTarget.dataset.value });
  },
  generateSuggestion() {
    const selectedFocus = getSelectedValues(this.data.focusOptions);
    const selectedTraits = getSelectedValues(this.data.traitOptions);

    if (!this.data.nickname || !this.data.birthDate) {
      wx.showToast({ title: "请先补充孩子信息", icon: "none" });
      return;
    }

    if (selectedFocus.length < 2) {
      wx.showToast({ title: "至少选2个方向", icon: "none" });
      return;
    }

    if (selectedTraits.length < 1) {
      wx.showToast({ title: "至少选1个特质", icon: "none" });
      return;
    }

    this.setData({
      isGeneratingSuggestion: true,
      suggestionErrorMessage: ""
    });

    void postJson<{
      sessionId: string;
      todaySuggestion: FirstGuidanceSuggestion;
    }>("/api/first-guidance", {
      childNickname: this.data.nickname,
      childBirthDate: this.data.birthDate,
      focusDirections: selectedFocus,
      currentChallenge: this.data.selectedChallenge,
      childTraits: selectedTraits
    })
      .then((response) => {
        this.setData({
          isGeneratingSuggestion: false,
          step: 4,
          firstGuidanceSessionId: response.sessionId,
          suggestion: response.todaySuggestion
        });
      })
      .catch((error) => {
        this.setData({
          isGeneratingSuggestion: false,
          suggestionErrorMessage: error.error || "生成建议未成功"
        });
      });
  },
  finishSetup(
    options: { acceptSuggestion: boolean; addToWeeklyPlan: boolean } = {
      acceptSuggestion: false,
      addToWeeklyPlan: false
    }
  ) {
    const selectedFocus = this.data.focusOptions.filter(
      (item: { selected: boolean }) => item.selected
    );
    if (!this.data.nickname || !this.data.birthDate || selectedFocus.length === 0) {
      wx.showToast({ title: "请补充信息", icon: "none" });
      return;
    }

    this.setData({ isSubmitting: true, suggestionErrorMessage: "" });
    const payload = {
      childProfile: {
        name: this.data.nickname,
        nickname: this.data.nickname,
        birthDate: this.data.birthDate,
        gender: this.data.gender
      },
      interests: selectedFocus.map((item: { label: string }) => item.label),
      annualGoals: selectedFocus.map((item: { label: string }) => ({
        title: item.label,
        category: item.label
      }))
    };

    void postJson<{ childId?: string }>("/api/onboarding", payload)
      .catch((error) => {
        if (error.statusCode === 409) {
          return postJson<{ childId?: string }>("/api/children", payload);
        }

        throw error;
      })
      .then((response) => {
        if (response.childId) {
          setActiveChildId(response.childId);
        }

        if (!options.acceptSuggestion || !this.data.firstGuidanceSessionId) {
          return response;
        }

        return postJson(
          `/api/first-guidance/${this.data.firstGuidanceSessionId}/accept`,
          options.addToWeeklyPlan
            ? {
                addToWeeklyPlan: true,
                taskAssigneeType: this.data.selectedAssignee,
                entrySurface: "mp_setup"
              }
            : {
                addToWeeklyPlan: false,
                entrySurface: "mp_setup"
              }
        ).then(() => response);
      })
      .then((response) => {
        if (response.childId) {
          setActiveChildId(response.childId);
        }

        if (
          options.acceptSuggestion &&
          !options.addToWeeklyPlan &&
          this.data.firstGuidanceSessionId &&
          this.data.suggestion
        ) {
          wx.setStorageSync(acceptedSuggestionStorageKey, {
            sessionId: this.data.firstGuidanceSessionId,
            title: this.data.suggestion.title,
            action: this.data.suggestion.action,
            childSpecificContext: this.data.suggestion.childSpecificContext,
            whyItHelps: this.data.suggestion.whyItHelps,
            savedAt: Date.now()
          });
        } else {
          wx.removeStorageSync(acceptedSuggestionStorageKey);
        }

        wx.setStorageSync(childProfileCacheStorageKey, {
          nickname: this.data.nickname,
          savedAt: Date.now()
        });
        wx.removeStorageSync(dashboardCacheStorageKey);
        wx.removeStorageSync(weeklyPlanCacheStorageKey);
        wx.removeStorageSync(growthRecordsCacheStorageKey);
        wx.showToast({
          title: options.addToWeeklyPlan ? "已加入本周计划" : "已保存陪伴方向",
          icon: "success"
        });
        wx.switchTab({ url: "/pages/home/index" });
      })
      .catch((error) => {
        const message =
          options.acceptSuggestion && error.statusCode === 409
            ? "档案已保存，请稍后再试着加入周计划"
            : error.error || "创建未成功";
        this.setData({ suggestionErrorMessage: message });
        wx.showToast({ title: message, icon: "none" });
      })
      .finally(() => {
        this.setData({ isSubmitting: false });
      });
  },
  saveAndTry() {
    this.finishSetup({
      acceptSuggestion: true,
      addToWeeklyPlan: false
    });
  },
  saveAndAddToWeeklyPlan() {
    this.finishSetup({
      acceptSuggestion: true,
      addToWeeklyPlan: true
    });
  }
});
