/* global Page, wx */
const { postJson } = require("../../services/api");
const { hasMiniProgramSession, loginWithWeChat } = require("../../services/session");

Page({
  data: {
    recordId: "",
    preview: null,
    errorMessage: "",
    isLoggedIn: false,
    primaryActionText: "微信登录后加入共同陪伴"
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
          preview: response.preview || {
            happenedOn: response.happenedOn || "",
            text: response.text || "",
            tags: response.tags || [],
            photoUrls: response.photoUrls || [],
            familyName: response.familyName || "",
            weeklyTheme: response.weeklyTheme || "",
            growthFocus: response.growthFocus || "",
            coachNote: response.coachNote || ""
          },
          errorMessage: "",
          primaryActionText: "进入家庭空间"
        });
      })
      .catch((error) => {
        const errorMessage =
          error.statusCode === 401
            ? "请先登录"
            : error.statusCode === 409
              ? "你还没有加入这个家庭空间"
              : error.error || "记录摘要加载失败";
        this.setData({
          errorMessage,
          primaryActionText:
            error.statusCode === 409 ? "创建我的成长空间" : "打开成长 OS"
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
