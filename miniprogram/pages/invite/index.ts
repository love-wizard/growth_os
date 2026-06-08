import { postJson } from "../../services/api";

Page({
  data: {
    familyId: "",
    role: "mother"
  },
  onLoad(query: Record<string, string | undefined>) {
    this.setData({
      familyId: query.familyId || "",
      role: query.role || "mother"
    });
  },
  shareInvite() {
    const { familyId, role } = this.data;
    void postJson("/api/wechat/family-invite", {
      familyId,
      role
    });
  }
});
