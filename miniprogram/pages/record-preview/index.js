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
    if (recordId && isLoggedIn) {
      this.loadPreview();
    }
  },
  onShow() {
    const isLoggedIn = hasMiniProgramSession();
    this.setData({ isLoggedIn });
    if (isLoggedIn && this.data.recordId && !this.data.preview) {
      this.loadPreview();
    }
  },
  loadPreview() {
    postJson("/api/wechat/record-share-preview", { recordId: this.data.recordId })
      .then((response) => {
        this.setData({
          preview: response.preview || response,
          errorMessage: ""
        });
      })
      .catch((error) => {
        this.setData({
          errorMessage:
            error.statusCode === 401
              ? "请先登录"
              : error.statusCode === 409
                ? "你还没有加入这个家庭空间"
                : error.error || "记录摘要加载失败"
        });
      });
  },
  login() {
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

        this.setData({
          isLoggedIn: true,
          errorMessage: ""
        });
        this.loadPreview();
        wx.showToast({ title: "已登录", icon: "success" });
      })
      .catch(() => {
        wx.showToast({ title: "登录失败", icon: "none" });
      });
  },
  openHome() {
    wx.switchTab({ url: "/pages/home/index" });
  }
});
