import { postJson } from "../../services/api";
import { hasMiniProgramSession, loginWithWeChat } from "../../services/session";

Page({
  data: {
    recordId: "",
    preview: null as null | {
      happenedOn: string;
      text: string;
      tags: string[];
    },
    errorMessage: "",
    isLoggedIn: false
  },
  onLoad(query: Record<string, string | undefined>) {
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
    void postJson<{
      preview?: {
        happenedOn: string;
        text: string;
        tags: string[];
      };
      happenedOn?: string;
      text?: string;
      tags?: string[];
    }>("/api/wechat/record-share-preview", { recordId: this.data.recordId })
      .then((response) => {
        this.setData({
          preview: response.preview || {
            happenedOn: response.happenedOn || "",
            text: response.text || "",
            tags: response.tags || []
          },
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
    void loginWithWeChat()
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
