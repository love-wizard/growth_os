/* global Page, wx */
const { getJson, postJson } = require("../../services/api");

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatRecord(record) {
  const tags = record.tags && record.tags.length ? record.tags : ["成长瞬间"];
  return {
    id: record.id,
    date: record.happened_on,
    title: tags[0],
    text: record.text,
    tags
  };
}

Page({
  data: {
    isLoading: false,
    isSubmitting: false,
    errorMessage: "",
    recordText: "",
    recordTags: "成长瞬间",
    records: []
  },
  onShow() {
    this.loadRecords();
  },
  loadRecords() {
    this.setData({ isLoading: true, errorMessage: "" });
    getJson("/api/growth-records")
      .then((response) => {
        this.setData({
          isLoading: false,
          records: (response.records || []).map(formatRecord)
        });
      })
      .catch((error) => {
        this.setData({
          isLoading: false,
          errorMessage:
            error.statusCode === 409 ? "请先完成首次配置" : error.error || "成长记录加载失败"
        });
      });
  },
  onRecordTextInput(event) {
    this.setData({ recordText: event.detail.value });
  },
  onRecordTagsInput(event) {
    this.setData({ recordTags: event.detail.value });
  },
  addRecord() {
    const text = this.data.recordText.trim();
    if (!text) {
      wx.showToast({ title: "先写一句记录", icon: "none" });
      return;
    }

    const tags = this.data.recordTags
      .split(/[，,]/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    this.setData({ isSubmitting: true });
    postJson("/api/growth-records", {
      happenedOn: todayString(),
      text,
      tags: tags.length ? tags : ["成长瞬间"]
    })
      .then(() => {
        wx.showToast({ title: "已记录", icon: "success" });
        this.setData({
          recordText: "",
          recordTags: "成长瞬间"
        });
        this.loadRecords();
      })
      .catch((error) => {
        wx.showToast({ title: error.error || "记录失败", icon: "none" });
      })
      .finally(() => {
        this.setData({ isSubmitting: false });
      });
  }
});
