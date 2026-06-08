import { postJson } from "../../services/api";

Page({
  data: {
    recordId: "",
    preview: null
  },
  onLoad(query: Record<string, string | undefined>) {
    const recordId = query.recordId || "";
    this.setData({ recordId });
    if (recordId) {
      void postJson("/api/wechat/record-share-preview", { recordId }).then((response) => {
        this.setData({ preview: response });
      });
    }
  }
});
