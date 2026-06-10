/* global Page, wx */
const { getJson, postJson, uploadFile } = require("../../services/api");
const growthRecordPrefillStorageKey = "growth_os_growth_record_prefill";
const growthRecordsCacheStorageKey = "growth_os_growth_records_cache";
const growthRecordsCacheTtlMs = 60 * 1000;

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatRecord(record) {
  const tags = record.tags && record.tags.length ? record.tags : ["成长瞬间"];
  return {
    id: record.id,
    date: record.happened_on,
    createdAt: record.created_at || "",
    title: tags[0],
    text: record.text,
    tags,
    photoUrls: (record.growth_record_media || [])
      .filter((media) => media.media_type === "photo" && media.signed_url)
      .map((media) => media.signed_url),
    shareImageUrl: ""
  };
}

function sortRecords(records) {
  return [...records].sort((left, right) => {
    if (left.date !== right.date) {
      return right.date.localeCompare(left.date);
    }

    return (right.createdAt || "").localeCompare(left.createdAt || "");
  });
}

function mergeCachedMedia(nextRecords, currentRecords) {
  const currentById = new Map(currentRecords.map((record) => [record.id, record]));

  return sortRecords(nextRecords).map((record) => {
    const current = currentById.get(record.id);
    if (!current) {
      return record;
    }

    const isSameRecord =
      current.date === record.date &&
      current.title === record.title &&
      current.text === record.text &&
      JSON.stringify(current.tags || []) === JSON.stringify(record.tags || []);

    if (!isSameRecord) {
      return record;
    }

    return {
      ...record,
      photoUrls: current.photoUrls && current.photoUrls.length ? current.photoUrls : record.photoUrls,
      shareImageUrl: current.shareImageUrl || record.shareImageUrl
    };
  });
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
  preloadShareImages(records) {
    const preloadTargets = records
      .filter((record) => record.photoUrls && record.photoUrls[0] && !record.shareImageUrl)
      .slice(0, 3);

    if (!preloadTargets.length) {
      return;
    }

    Promise.all(
      preloadTargets.map(
        (record) =>
          new Promise((resolve) => {
            wx.getImageInfo({
              src: (record.photoUrls && record.photoUrls[0]) || "",
              success: (result) => {
                resolve({ id: record.id, shareImageUrl: result.path });
              },
              fail: () => resolve(null)
            });
          })
      )
    ).then((results) => {
      const updates = new Map(
        results
          .filter((result) => result && result.id && result.shareImageUrl)
          .map((result) => [result.id, result.shareImageUrl])
      );

      if (!updates.size) {
        return;
      }

      const nextRecords = this.data.records.map((item) =>
        updates.has(item.id) ? { ...item, shareImageUrl: updates.get(item.id) } : item
      );

      wx.setStorageSync(growthRecordsCacheStorageKey, {
        savedAt: Date.now(),
        records: nextRecords
      });
      this.setData({
        records: nextRecords
      });
    });
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
      path:
        `/pages/record-preview/index?recordId=${shareRecord.id}` +
        `&text=${encodeURIComponent(shareRecord.text || "")}` +
        `&date=${encodeURIComponent(shareRecord.date || "")}` +
        `&imageUrl=${encodeURIComponent(shareRecord.imageUrl || "")}`,
      imageUrl: shareRecord.imageUrl || undefined
    };
  },
  onShow() {
    this.consumePrefilledRecord();
    const usedCache = this.hydrateRecordCache();
    this.loadRecords({ useLoadingState: !usedCache, skipIfFresh: usedCache });
  },
  hydrateRecordCache() {
    const cached = wx.getStorageSync(growthRecordsCacheStorageKey);

    if (!cached || !cached.savedAt || !cached.records) {
      return false;
    }

    if (Date.now() - cached.savedAt > growthRecordsCacheTtlMs) {
      return false;
    }

    this.setData({
      isLoading: false,
      records: cached.records
    });
    return true;
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
  loadRecords(options) {
    if (options && options.skipIfFresh) {
      const cached = wx.getStorageSync(growthRecordsCacheStorageKey);
      if (cached && cached.savedAt && Date.now() - cached.savedAt <= growthRecordsCacheTtlMs) {
        return;
      }
    }

    if (!options || options.useLoadingState !== false) {
      this.setData({ isLoading: true, errorMessage: "" });
    }

    getJson("/api/growth-records")
      .then((response) => {
        const records = mergeCachedMedia(
          (response.records || []).map(formatRecord),
          this.data.records
        );
        wx.setStorageSync(growthRecordsCacheStorageKey, {
          savedAt: Date.now(),
          records
        });
        this.setData({
          isLoading: false,
          records
        });
        this.preloadShareImages(records);
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
        text: event.currentTarget.dataset.text || "",
        date: event.currentTarget.dataset.date || "",
        imageUrl: event.currentTarget.dataset.imageUrl || ""
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
