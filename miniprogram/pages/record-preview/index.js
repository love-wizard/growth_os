/* global Page, wx */
const { postJson } = require("../../services/api");
const { hasMiniProgramSession, loginWithWeChat } = require("../../services/session");

Page({
  data: {
    recordId: "",
    preview: null,
    errorMessage: "",
    isLoggedIn: false
  },
  onLoad(query) {
    const recordId = query.recordId || "";
    const isLoggedIn = hasMiniProgramSession();
    this.setData({ recordId, isLoggedIn });
    if (recordId) {
      this.loadPreview();
    }
  },
  onShow() {
    const isLoggedIn = hasMiniProgramSession();
    this.setData({ isLoggedIn });
    if (this.data.recordId && !this.data.preview) {
      this.loadPreview();
    }
  },
  loadPreview() {
    postJson("/api/wechat/public-record-share-preview", { recordId: this.data.recordId })
      .then((response) => {
        this.setData({
          preview: response.preview || {
            happenedOn: response.happenedOn || "",
            text: response.text || "",
            photoUrls: response.photoUrls || [],
            familyName: response.familyName || "",
            subtitle: response.subtitle || ""
          },
          errorMessage: ""
        });
      })
      .catch((error) => {
        this.setData({
          errorMessage: error.error || "记录加载失败"
        });
      });
  },
  previewPhoto(event) {
    const current = event.currentTarget.dataset.current;
    const urls = event.currentTarget.dataset.urls || [];
    if (!current || !urls.length) {
      return;
    }

    wx.previewImage({
      current,
      urls
    });
  },
  openGrowthOs() {
    if (hasMiniProgramSession()) {
      wx.switchTab({ url: "/pages/home/index" });
      return;
    }

    wx.showToast({ title: "正在登录", icon: "loading" });
    loginWithWeChat()
      .then((result) => {
        if (result.requiresBackend) {
          this.setData({
            errorMessage: result.errorMessage || "登录失败"
          });
          wx.showToast({ title: "登录失败", icon: "none" });
          return;
        }

        this.setData({ isLoggedIn: true, errorMessage: "" });
        wx.switchTab({ url: "/pages/home/index" });
        wx.showToast({ title: "已登录", icon: "success" });
      })
      .catch(() => {
        wx.showToast({ title: "登录失败", icon: "none" });
      });
  }
});
