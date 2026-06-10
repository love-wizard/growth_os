import { getJson, postJson, uploadFile } from "../../services/api";

const growthRecordPrefillStorageKey = "growth_os_growth_record_prefill";
const growthRecordsCacheStorageKey = "growth_os_growth_records_cache";
const growthRecordsCacheRefreshMs = 5 * 60 * 1000;
const growthRecordsCacheDisplayMs = 30 * 60 * 1000;

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatRecord(record: {
  id: string;
  happened_on: string;
  created_at?: string;
  text: string;
  tags?: string[];
  growth_record_media?: Array<{
    media_type: string;
    signed_url?: string;
  }>;
}) {
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
      .map((media) => media.signed_url as string),
    shareImageUrl: ""
  };
}

function sortRecords<T extends { date: string; createdAt?: string }>(records: T[]) {
  return [...records].sort((left, right) => {
    if (left.date !== right.date) {
      return right.date.localeCompare(left.date);
    }

    return (right.createdAt || "").localeCompare(left.createdAt || "");
  });
}

function mergeCachedMedia(
  nextRecords: Array<{
    id: string;
    date: string;
    createdAt?: string;
    title: string;
    text: string;
    tags: string[];
    photoUrls: string[];
    shareImageUrl?: string;
  }>,
  currentRecords: Array<{
    id: string;
    date: string;
    createdAt?: string;
    title: string;
    text: string;
    tags: string[];
    photoUrls?: string[];
    shareImageUrl?: string;
  }>
) {
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
      photoUrls: current.photoUrls?.length ? current.photoUrls : record.photoUrls,
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
    shareRecord: null as null | {
      id: string;
      title: string;
      text: string;
      date?: string;
      imageUrl?: string;
    },
    selectedPhotoName: "",
    selectedPhotoPath: "",
    records: []
  },
  preloadShareImages(records: Array<{ id: string; photoUrls?: string[]; shareImageUrl?: string }>) {
    const preloadTargets = records
      .filter((record) => record.photoUrls?.[0] && !record.shareImageUrl)
      .slice(0, 3);

    if (!preloadTargets.length) {
      return;
    }

    void Promise.all(
      preloadTargets.map(
        (record) =>
          new Promise<{ id: string; shareImageUrl: string } | null>((resolve) => {
            wx.getImageInfo({
              src: record.photoUrls?.[0] || "",
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
          .filter(
            (result): result is { id: string; shareImageUrl: string } =>
              Boolean(result?.id && result.shareImageUrl)
          )
          .map((result) => [result.id, result.shareImageUrl])
      );

      if (!updates.size) {
        return;
      }

      const nextRecords = (this.data.records as Array<{
        id: string;
        shareImageUrl?: string;
      }>).map((item) =>
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
    const cached = wx.getStorageSync(growthRecordsCacheStorageKey) as
      | {
          savedAt?: number;
          records?: unknown[];
        }
      | undefined;

    if (!cached?.savedAt || !cached.records) {
      return false;
    }

    if (Date.now() - cached.savedAt > growthRecordsCacheDisplayMs) {
      return false;
    }

    this.setData({
      isLoading: false,
      records: cached.records
    });
    return true;
  },
  consumePrefilledRecord() {
    const draft = wx.getStorageSync(growthRecordPrefillStorageKey) as
      | { text?: string; tags?: string }
      | undefined;

    if (!draft?.text) {
      return;
    }

    wx.removeStorageSync(growthRecordPrefillStorageKey);
    this.setData({
      recordText: draft.text,
      recordTags: draft.tags || "成长瞬间"
    });
  },
  loadRecords(options?: { useLoadingState?: boolean; skipIfFresh?: boolean }) {
    if (options?.skipIfFresh) {
      const cached = wx.getStorageSync(growthRecordsCacheStorageKey) as
        | { savedAt?: number }
        | undefined;

      if (cached?.savedAt && Date.now() - cached.savedAt <= growthRecordsCacheRefreshMs) {
        return;
      }
    }

    if (options?.useLoadingState !== false) {
      this.setData({ isLoading: true, errorMessage: "" });
    }

    void getJson<{
      records: Array<{
        id: string;
        happened_on: string;
        created_at?: string;
        text: string;
        tags?: string[];
        growth_record_media?: Array<{
          media_type: string;
          signed_url?: string;
        }>;
      }>;
    }>("/api/growth-records")
      .then((response) => {
        const records = mergeCachedMedia(
          (response.records || []).map(formatRecord),
          this.data.records as Array<{
            id: string;
            date: string;
            createdAt?: string;
            title: string;
            text: string;
            tags: string[];
            photoUrls?: string[];
            shareImageUrl?: string;
          }>
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
  onRecordTextInput(event: { detail: { value: string } }) {
    this.setData({ recordText: event.detail.value });
  },
  onRecordTagsInput(event: { detail: { value: string } }) {
    this.setData({ recordTags: event.detail.value });
  },
  choosePhoto() {
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (response) => {
        const path = response.tempFilePaths?.[0];
        if (!path) {
          return;
        }

        this.setData({
          selectedPhotoName: path.split("/").pop() || "成长照片.jpg",
          selectedPhotoPath: response.tempFiles?.[0]?.path || path
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
  previewRecordPhoto(event: { currentTarget: { dataset: { current?: string; urls?: string[] } } }) {
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
  prepareShareRecord(event: {
    currentTarget: {
      dataset: { id?: string; title?: string; text?: string; date?: string; imageUrl?: string };
    };
  }) {
    this.setData({
      shareRecord: {
        id: event.currentTarget.dataset.id || "",
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
      .map((tag: string) => tag.trim())
      .filter(Boolean);

    this.setData({ isSubmitting: true });
    void postJson<{
      record?: {
        id: string;
      };
    }>("/api/growth-records", {
      happenedOn: todayString(),
      text,
      tags: tags.length ? tags : ["成长瞬间"]
    })
      .then((response) => {
        if (!this.data.selectedPhotoPath || !response.record?.id) {
          return response;
        }

        return uploadFile(`/api/growth-records/${response.record.id}/media`, this.data.selectedPhotoPath);
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
