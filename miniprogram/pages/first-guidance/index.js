/* global Page, wx */
const { postJson } = require("../../services/api");

const onboardingGuideSeenStorageKey = "growth_os_onboarding_guide_seen";

Page({
  data: {
    scenarioType: "limited_evening_time"
  },
  onLoad(query) {
    const scenarioType = query.scenarioType || "limited_evening_time";
    this.setData({ scenarioType });
    postJson("/api/wechat/scenario-entry", {
      scenarioType,
      sourceContext: {
        surface: "mini_program"
      }
    });
  },
  openSetup() {
    wx.setStorageSync(onboardingGuideSeenStorageKey, true);
    wx.navigateTo({ url: "/pages/setup/index" });
  },
  openHome() {
    wx.setStorageSync(onboardingGuideSeenStorageKey, true);
    wx.switchTab({ url: "/pages/home/index" });
  }
});
