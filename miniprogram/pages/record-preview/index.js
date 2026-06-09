/* global Page */
const { postJson } = require("../../services/api");

Page({
  data: {
    recordId: "",
    preview: null
  },
  onLoad(query) {
    const recordId = query.recordId || "";
    this.setData({ recordId });
    if (recordId) {
      postJson("/api/wechat/record-share-preview", { recordId }).then((response) => {
        this.setData({ preview: response });
      });
    }
  }
});
