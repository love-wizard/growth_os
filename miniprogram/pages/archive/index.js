/* global Page, wx */
const { getJson, postJson, uploadFile } = require("../../services/api");
const growthRecordPrefillStorageKey = "growth_os_growth_record_prefill";

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
    tags,
    photoUrls: (record.growth_record_media || [])
      .filter((media) => media.media_type === "photo" && media.signed_url)
      .map((media) => media.signed_url)
  };
}

Page({
  data: {
    isLoading: false,
    isSubmitting: false,
    errorMessage: "",
    recordText: "",
    recordTags: "成长瞬间",
    shareRecord: null,
    selectedPhotoName: "",
    selectedPhotoPath: "",
    records: []
  },
  onShareAppMessage() {
    const shareRecord = this.data.shareRecord;
    if (!shareRecord) {
      return {
        title: "看看这个成长瞬间",
        path: "/pages/archive/index"
      };
    }

    return {
      title: `${shareRecord.title || "成长瞬间"} | ${shareRecord.text.slice(0, 20)}`,
      path: `/pages/record-preview/index?recordId=${shareRecord.id}`
    };
  },
  onShow() {
    this.consumePrefilledRecord();
    this.loadRecords();
  },
  consumePrefilledRecord() {
    const draft = wx.getStorageSync(growthRecordPrefillStorageKey);

    if (!draft || !draft.text) {
      return;
    }

    wx.removeStorageSync(growthRecordPrefillStorageKey);
    this.setData({
      recordText: draft.text,
      recordTags: draft.tags || "成长瞬间"
    });
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
  choosePhoto() {
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (response) => {
        const path = response.tempFilePaths && response.tempFilePaths[0];
        if (!path) {
          return;
        }

        const tempFile = response.tempFiles && response.tempFiles[0];
        this.setData({
          selectedPhotoName: path.split("/").pop() || "成长照片.jpg",
          selectedPhotoPath: tempFile && tempFile.path ? tempFile.path : path
        });
      }
    });
  },
  clearPhoto() {
    this.setData({
      selectedPhotoName: "",
      selectedPhotoPath: ""
    });
  },
  previewRecordPhoto(event) {
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
  prepareShareRecord(event) {
    this.setData({
      shareRecord: {
        id: event.currentTarget.dataset.id,
        title: event.currentTarget.dataset.title || "成长瞬间",
        text: event.currentTarget.dataset.text || ""
      }
    });
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
      .then((response) => {
        if (!this.data.selectedPhotoPath || !response.record || !response.record.id) {
          return response;
        }

        return uploadFile(
          `/api/growth-records/${response.record.id}/media`,
          this.data.selectedPhotoPath,
          "file"
        );
      })
      .then(() => {
        wx.showToast({ title: "已记录", icon: "success" });
        this.setData({
          recordText: "",
          recordTags: "成长瞬间",
          selectedPhotoName: "",
          selectedPhotoPath: ""
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
