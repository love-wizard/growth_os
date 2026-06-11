/* global Page, wx */
const onboardingGuideSeenStorageKey = "growth_os_onboarding_guide_seen";
const childProfileCacheStorageKey = "growth_os_child_profile_cache";

Page({
  onLoad() {
    const seenGuide = wx.getStorageSync(onboardingGuideSeenStorageKey);
    const childProfile = wx.getStorageSync(childProfileCacheStorageKey);
    if (!seenGuide && !(childProfile && childProfile.nickname)) {
      wx.redirectTo({ url: "/pages/first-guidance/index" });
      return;
    }

    wx.switchTab({ url: "/pages/home/index" });
  }
});
