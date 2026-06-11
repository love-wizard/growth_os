/* global Page, wx */
const {
  getJson,
  isTimeoutRequestError,
  postJson,
  postJsonWithOptions,
  uploadFile
} = require("../../services/api");
const growthRecordPrefillStorageKey = "growth_os_growth_record_prefill";
const growthRecordsCacheStorageKey = "growth_os_growth_records_cache_v2";
const growthRecordsCacheRefreshMs = 5 * 60 * 1000;
const growthRecordsCacheDisplayMs = 55 * 60 * 1000;
const aiRequestTimeoutMs = 30000;
const recordCategories = ["成长瞬间", "运动健康", "阅读表达", "英语启蒙", "兴趣培养", "情绪关系", "户外探索"];

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentTimeString() {
  const now = new Date();
  return `${now.getHours()}`.padStart(2, "0") + ":" + `${now.getMinutes()}`.padStart(2, "0");
}

function currentSecondString() {
  return `${new Date().getSeconds()}`.padStart(2, "0");
}

function buildLocalDateTime(date, time, seconds = currentSecondString()) {
  const [hours = "00", minutes = "00"] = time.split(":");
  return new Date(`${date}T${hours}:${minutes}:${seconds}`).toISOString();
}

function formatDateTimeLabel(value, fallbackDate) {
  const date = value ? new Date(value) : fallbackDate ? new Date(`${fallbackDate}T00:00:00`) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return fallbackDate || "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatRecord(record) {
  const tags = record.tags && record.tags.length ? record.tags : ["成长瞬间"];
  return {
    id: record.id,
    date: record.happened_on,
    happenedAt: record.happened_at || "",
    dateTimeLabel: formatDateTimeLabel(record.happened_at, record.happened_on),
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

function getRecordCategory(record) {
  return (record.tags && record.tags[0]) || "成长瞬间";
}

function filterRecords(records, filters) {
  const keyword = (filters.keyword || "").trim().toLowerCase();
  return records.filter((record) => {
    if (filters.startDate && record.date < filters.startDate) {
      return false;
    }

    if (filters.endDate && record.date > filters.endDate) {
      return false;
    }

    if (filters.category && filters.category !== "全部" && getRecordCategory(record) !== filters.category) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const searchable = `${record.title} ${record.text} ${(record.tags || []).join(" ")}`.toLowerCase();
    return searchable.includes(keyword);
  });
}

function formatMonthlyReport(response) {
  if (!response || response.mode !== "growth_analysis") {
    return null;
  }

  return {
    title: response.title || "本月成长月报",
    sections: (response.sections || []).map((section) => ({
      area: section.area,
      summary: section.summary,
      evidence: section.evidence || []
    })),
    nextActions: response.nextActions || []
  };
}

function sortRecords(records) {
  return [...records].sort((left, right) => {
    const leftTime = left.happenedAt || left.createdAt || left.date;
    const rightTime = right.happenedAt || right.createdAt || right.date;
    if (leftTime !== rightTime) {
      return rightTime.localeCompare(leftTime);
    }

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
      current.happenedAt === record.happenedAt &&
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
    hasRecordData: false,
    isSubmitting: false,
    isRecordComposerOpen: false,
    isFilterOpen: false,
    errorMessage: "",
    recordText: "",
    recordCategory: "成长瞬间",
    selectedCategoryIndex: 0,
    recordCategories,
    filterCategoryOptions: ["全部", ...recordCategories],
    selectedFilterCategoryIndex: 0,
    filterStartDate: "",
    filterEndDate: "",
    filterKeyword: "",
    isGeneratingMonthlyReport: false,
    monthlyReportError: "",
    monthlyReport: null,
    shareRecord: null,
    selectedPhotoName: "",
    selectedPhotoPath: "",
    selectedPhotos: [],
    happenedDate: todayString(),
    happenedTime: currentTimeString(),
    allRecords: [],
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

      const currentAllRecords = this.data.allRecords;
      const nextRecords = currentAllRecords.map((item) =>
        updates.has(item.id) ? { ...item, shareImageUrl: updates.get(item.id) } : item
      );

      wx.setStorageSync(growthRecordsCacheStorageKey, {
        savedAt: Date.now(),
        records: nextRecords
      });

      const changed = nextRecords.some((item, index) => {
        const current = currentAllRecords[index];
        return item.shareImageUrl !== (current && current.shareImageUrl);
      });
      if (!changed) {
        return;
      }

      this.setData({
        allRecords: nextRecords,
        records: this.getFilteredRecords(nextRecords)
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
        `&date=${encodeURIComponent(shareRecord.dateTimeLabel || shareRecord.date || "")}` +
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

    if (Date.now() - cached.savedAt > growthRecordsCacheDisplayMs) {
      return false;
    }

    this.setData({
      isLoading: false,
      hasRecordData: true,
      allRecords: cached.records,
      records: this.getFilteredRecords(cached.records)
    });
    return true;
  },
  consumePrefilledRecord() {
    const draft = wx.getStorageSync(growthRecordPrefillStorageKey);

    if (!draft || !draft.text) {
      return;
    }

    wx.removeStorageSync(growthRecordPrefillStorageKey);
    const category = (draft.tags || "成长瞬间").split(/[，,]/)[0] || "成长瞬间";
    this.setData({
      isRecordComposerOpen: true,
      recordText: draft.text,
      recordCategory: category,
      selectedCategoryIndex: Math.max(0, recordCategories.indexOf(category))
    });
  },
  getFilteredRecords(records) {
    return filterRecords(sortRecords(records || this.data.allRecords), {
      startDate: this.data.filterStartDate,
      endDate: this.data.filterEndDate,
      category: this.data.filterCategoryOptions[this.data.selectedFilterCategoryIndex],
      keyword: this.data.filterKeyword
    });
  },
  applyFilters() {
    this.setData({
      records: this.getFilteredRecords()
    });
  },
  toggleFilters() {
    this.setData({ isFilterOpen: !this.data.isFilterOpen });
  },
  loadRecords(options) {
    if (options && options.skipIfFresh) {
      const cached = wx.getStorageSync(growthRecordsCacheStorageKey);
      if (cached && cached.savedAt && Date.now() - cached.savedAt <= growthRecordsCacheRefreshMs) {
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
          this.data.allRecords
        );
        wx.setStorageSync(growthRecordsCacheStorageKey, {
          savedAt: Date.now(),
          records
        });
        this.setData({
          isLoading: false,
          hasRecordData: true,
          allRecords: records,
          records: this.getFilteredRecords(records)
        });
        this.preloadShareImages(records);
      })
      .catch((error) => {
        this.setData({
          isLoading: false,
          hasRecordData: this.data.records.length > 0,
          errorMessage:
            error.statusCode === 409 ? "请先完成首次配置" : error.error || "成长记录加载失败"
        });
      });
  },
  onRecordTextInput(event) {
    this.setData({ recordText: event.detail.value });
  },
  openRecordComposer() {
    this.setData({
      isRecordComposerOpen: true,
      happenedDate: this.data.happenedDate || todayString(),
      happenedTime: this.data.happenedTime || currentTimeString()
    });
  },
  closeRecordComposer() {
    if (this.data.isSubmitting) {
      return;
    }

    this.setData({ isRecordComposerOpen: false });
  },
  noop() {},
  onRecordCategoryChange(event) {
    const selectedCategoryIndex = Number(event.detail.value);
    this.setData({
      selectedCategoryIndex,
      recordCategory: recordCategories[selectedCategoryIndex] || "成长瞬间"
    });
  },
  onFilterStartDateChange(event) {
    this.setData({ filterStartDate: event.detail.value });
    this.applyFilters();
  },
  onFilterEndDateChange(event) {
    this.setData({ filterEndDate: event.detail.value });
    this.applyFilters();
  },
  onFilterCategoryChange(event) {
    this.setData({ selectedFilterCategoryIndex: Number(event.detail.value) });
    this.applyFilters();
  },
  onFilterKeywordInput(event) {
    this.setData({ filterKeyword: event.detail.value });
    this.applyFilters();
  },
  clearFilters() {
    this.setData({
      filterStartDate: "",
      filterEndDate: "",
      filterKeyword: "",
      selectedFilterCategoryIndex: 0
    });
    this.applyFilters();
  },
  onHappenedDateChange(event) {
    this.setData({ happenedDate: event.detail.value });
  },
  onHappenedTimeChange(event) {
    this.setData({ happenedTime: event.detail.value });
  },
  choosePhoto() {
    const selectedPhotos = this.data.selectedPhotos;
    const remainingCount = 3 - selectedPhotos.length;
    if (remainingCount <= 0) {
      wx.showToast({ title: "最多选择3张照片", icon: "none" });
      return;
    }

    wx.chooseImage({
      count: remainingCount,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (response) => {
        const nextPhotos = (response.tempFilePaths || [])
          .map((path, index) => ({
            name: path.split("/").pop() || `成长照片${selectedPhotos.length + index + 1}.jpg`,
            path:
              response.tempFiles && response.tempFiles[index] && response.tempFiles[index].path
                ? response.tempFiles[index].path
                : path
          }))
          .filter((photo) => photo.path);

        if (!nextPhotos.length) {
          return;
        }

        this.setData({
          selectedPhotos: [...selectedPhotos, ...nextPhotos].slice(0, 3),
          selectedPhotoName: "",
          selectedPhotoPath: ""
        });
      }
    });
  },
  removeSelectedPhoto(event) {
    const index = Number(event.currentTarget.dataset.index);
    const selectedPhotos = [...this.data.selectedPhotos];
    if (Number.isNaN(index)) {
      return;
    }

    selectedPhotos.splice(index, 1);
    this.setData({
      selectedPhotos
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
        dateTimeLabel: event.currentTarget.dataset.date || "",
        imageUrl: event.currentTarget.dataset.imageUrl || ""
      }
    });
  },
  generateMonthlyReport() {
    this.setData({
      isGeneratingMonthlyReport: true,
      monthlyReportError: "",
      monthlyReport: null
    });

    postJsonWithOptions("/api/ai/coach", {
      mode: "growth_analysis",
      message:
        "请基于本月成长记录、兴趣记录和周计划，产出一份成长月报，按身体发展、阅读表达、兴趣培养、英语启蒙、情绪关系总结。"
    }, {
      timeoutMs: aiRequestTimeoutMs
    })
      .then((result) => {
        const monthlyReport = formatMonthlyReport(result.response);
        this.setData({
          isGeneratingMonthlyReport: false,
          monthlyReport,
          monthlyReportError: monthlyReport ? "" : "月报生成结果格式不完整，请再试一次。"
        });
      })
      .catch((error) => {
        const message = isTimeoutRequestError(error)
          ? "月报生成时间较长，已超过等待时间，请再试一次。"
          : error.error || "月报生成失败";
        this.setData({
          isGeneratingMonthlyReport: false,
          monthlyReportError: message
        });
      });
  },
  addRecord() {
    const text = this.data.recordText.trim();
    if (!text) {
      wx.showToast({ title: "先写一句记录", icon: "none" });
      return;
    }

    const tags = [this.data.recordCategory || "成长瞬间"];

    this.setData({ isSubmitting: true });
    postJson("/api/growth-records", {
      happenedOn: this.data.happenedDate || todayString(),
      happenedAt: buildLocalDateTime(
        this.data.happenedDate || todayString(),
        this.data.happenedTime || currentTimeString()
      ),
      text,
      tags: tags.length ? tags : ["成长瞬间"]
    })
      .then((response) => {
        const selectedPhotos = this.data.selectedPhotos;
        if (!selectedPhotos.length || !response.record || !response.record.id) {
          return response;
        }

        return selectedPhotos.reduce(
          (promise, photo) =>
            promise.then(() =>
              uploadFile(`/api/growth-records/${response.record.id}/media`, photo.path, "file")
            ),
          Promise.resolve(response)
        );
      })
      .then(() => {
        wx.showToast({ title: "已记录", icon: "success" });
        this.setData({
          isRecordComposerOpen: false,
          recordText: "",
          recordCategory: "成长瞬间",
          selectedCategoryIndex: 0,
          selectedPhotoName: "",
          selectedPhotoPath: "",
          selectedPhotos: [],
          happenedDate: todayString(),
          happenedTime: currentTimeString()
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
