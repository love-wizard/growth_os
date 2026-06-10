/* global Page, wx */
const { postJson } = require("../../services/api");

const focusOptions = [
  { label: "阅读习惯", selected: true },
  { label: "英语启蒙", selected: true },
  { label: "户外探索", selected: false },
  { label: "情绪表达", selected: false },
  { label: "钢琴兴趣", selected: false },
  { label: "运动习惯", selected: false }
];
const challengeOptions = ["今晚只有30分钟", "阅读有点断", "不想练琴", "周末不知道做什么"];
const traitOptions = ["好奇", "敏感", "喜欢被鼓励", "有主见", "慢热", "容易受挫"];

Page({
  data: {
    step: 1,
    totalSteps: 4,
    isSubmitting: false,
    nickname: "",
    birthDate: "",
    gender: "female",
    focusOptions,
    challengeOptions,
    traitOptions,
    selectedChallenge: "今晚只有30分钟",
    selectedTraits: ["好奇", "喜欢被鼓励"],
    suggestion: {
      title: "今晚先做一次绘本找宝藏",
      action: "选一本孩子熟悉的绘本，家长读一页，孩子负责找一个画面里的小线索。",
      minutes: "10-15分钟"
    }
  },
  nextStep() {
    const next = Math.min(this.data.step + 1, this.data.totalSteps);
    this.setData({ step: next });
  },
  prevStep() {
    const prev = Math.max(this.data.step - 1, 1);
    this.setData({ step: prev });
  },
  onNicknameInput(event) {
    this.setData({ nickname: event.detail.value });
  },
  onBirthDateInput(event) {
    this.setData({ birthDate: event.detail.value });
  },
  chooseGender(event) {
    this.setData({ gender: event.currentTarget.dataset.value });
  },
  toggleFocus(event) {
    const label = event.currentTarget.dataset.value;
    const focusOptions = this.data.focusOptions.map((item) =>
      item.label === label ? { ...item, selected: !item.selected } : item
    );
    this.setData({ focusOptions });
  },
  chooseChallenge(event) {
    this.setData({ selectedChallenge: event.currentTarget.dataset.value });
  },
  finishSetup() {
    const selectedFocus = this.data.focusOptions.filter((item) => item.selected);
    if (!this.data.nickname || !this.data.birthDate || selectedFocus.length === 0) {
      wx.showToast({ title: "请补充信息", icon: "none" });
      return;
    }

    this.setData({ isSubmitting: true });
    postJson("/api/onboarding", {
      childProfile: {
        name: this.data.nickname,
        nickname: this.data.nickname,
        birthDate: this.data.birthDate,
        gender: this.data.gender
      },
      interests: selectedFocus.map((item) => item.label),
      annualGoals: selectedFocus.map((item) => ({
        title: item.label,
        category: item.label
      }))
    })
      .then(() => {
        wx.showToast({ title: "已生成成长系统", icon: "success" });
        wx.switchTab({ url: "/pages/home/index" });
      })
      .catch((error) => {
        if (error.statusCode === 409) {
          wx.switchTab({ url: "/pages/home/index" });
          return;
        }
        wx.showToast({ title: error.error || "创建失败", icon: "none" });
      })
      .finally(() => {
        this.setData({ isSubmitting: false });
      });
  }
});
