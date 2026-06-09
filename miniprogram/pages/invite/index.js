/* global Page */
const { postJson } = require("../../services/api");

Page({
  data: {
    familyId: "",
    role: "mother"
  },
  onLoad(query) {
    this.setData({
      familyId: query.familyId || "",
      role: query.role || "mother"
    });
  },
  shareInvite() {
    const { familyId, role } = this.data;
    postJson("/api/wechat/family-invite", {
      familyId,
      role
    });
  }
});
