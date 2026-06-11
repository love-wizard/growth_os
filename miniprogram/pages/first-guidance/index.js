/* global Page, wx */
const { postJson } = require("../../services/api");

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
    wx.navigateTo({ url: "/pages/setup/index" });
  }
});
