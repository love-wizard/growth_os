import { postJson } from "../../services/api";
import { hasMiniProgramSession, loginWithWeChat } from "../../services/session";

Page({
  data: {
    inviteId: "",
    role: "mother",
    sharePath: "",
    status: "邀请另一位家长加入同一个成长空间。",
    isLoggedIn: false,
    isLoading: false
  },
  onLoad(query: Record<string, string | undefined>) {
    this.setData({
      inviteId: query.inviteId || "",
      role: query.role || "mother",
      isLoggedIn: hasMiniProgramSession(),
      status: query.inviteId ? "你收到了一份家庭成长空间邀请。" : "邀请另一位家长加入同一个成长空间。"
    });
  },
  onShow() {
    this.setData({ isLoggedIn: hasMiniProgramSession() });
  },
  onShareAppMessage() {
    return {
      title: "邀请你一起记录孩子成长",
      path: this.data.sharePath || `/pages/invite/index?inviteId=${this.data.inviteId}`
    };
  },
  chooseRole(event: { currentTarget: { dataset: { role: string } } }) {
    this.setData({ role: event.currentTarget.dataset.role });
  },
  shareInvite() {
    const { role } = this.data;
    this.setData({ isLoading: true, status: "正在生成邀请..." });
    void postJson<{ inviteId: string; sharePath: string }>("/api/wechat/family-invite", {
      role
    })
      .then((result) => {
        this.setData({
          inviteId: result.inviteId,
          sharePath: result.sharePath,
          status: "邀请已生成，请点击右上角菜单分享给另一位家长。"
        });
        wx.showToast({ title: "邀请已生成", icon: "success" });
      })
      .catch((error) => {
        this.setData({
          status: error.statusCode === 409 ? "请先完成首次配置" : error.error || "生成邀请未成功"
        });
        wx.showToast({ title: "生成未成功", icon: "none" });
      })
      .finally(() => {
        this.setData({ isLoading: false });
      });
  },
  loginAndAccept() {
    this.setData({ isLoading: true, status: "正在确认身份..." });
    const loginPromise = hasMiniProgramSession()
      ? Promise.resolve({})
      : loginWithWeChat();

    void loginPromise
      .then((result) => {
        const loginResult = result as { requiresBackend?: boolean; errorMessage?: string };
        if (loginResult.requiresBackend) {
          throw new Error(loginResult.errorMessage || "微信登录未成功");
        }
        return postJson(`/api/wechat/family-invite/${this.data.inviteId}/accept`, {});
      })
      .then(() => {
        this.setData({
          isLoggedIn: true,
          status: "已加入家庭成长空间"
        });
        wx.showToast({ title: "已加入", icon: "success" });
        wx.switchTab({ url: "/pages/home/index" });
      })
      .catch((error) => {
        this.setData({
          status: error.message || error.error || "接受邀请未成功"
        });
        wx.showToast({ title: "加入未成功", icon: "none" });
      })
      .finally(() => {
        this.setData({ isLoading: false });
      });
  }
});
