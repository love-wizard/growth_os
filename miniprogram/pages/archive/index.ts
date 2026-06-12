import {
  getActiveChildId,
  getJson,
  postJson,
  setActiveChildId,
  uploadFile
} from "../../services/api";

const growthRecordPrefillStorageKey = "growth_os_growth_record_prefill";
const growthRecordsCacheStorageKey = "growth_os_growth_records_cache_v5";
const aiCoachPrefillStorageKey = "growth_os_ai_coach_prefill";
const growthRecordsCacheRefreshMs = 5 * 60 * 1000;
const growthRecordsCacheDisplayMs = 55 * 60 * 1000;
const recordCategories = ["成长瞬间", "运动健康", "阅读表达", "英语启蒙", "兴趣培养", "情绪关系", "户外探索"];
const recordScopeOptions = ["默认孩子", "全家"];

type ArchiveChild = {
  id: string;
  nickname: string;
  avatarText?: string;
  selected?: boolean;
};

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

function buildLocalDateTime(date: string, time: string, seconds = currentSecondString()) {
  const [hours = "00", minutes = "00"] = time.split(":");
  return new Date(`${date}T${hours}:${minutes}:${seconds}`).toISOString();
}

function isMidnight(value?: string | null) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) &&
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0;
}

function combineDateWithTime(dateValue?: string, timeSource?: string | null) {
  if (!dateValue) {
    return timeSource || "";
  }

  const time = timeSource ? new Date(timeSource) : null;
  if (!time || Number.isNaN(time.getTime())) {
    return `${dateValue}T00:00:00`;
  }

  const hours = `${time.getHours()}`.padStart(2, "0");
  const minutes = `${time.getMinutes()}`.padStart(2, "0");
  const seconds = `${time.getSeconds()}`.padStart(2, "0");
  return `${dateValue}T${hours}:${minutes}:${seconds}`;
}

function getDisplayDateTime(value?: string | null, happenedOn?: string, createdAt?: string) {
  if (value && !isMidnight(value)) {
    return value;
  }

  return combineDateWithTime(happenedOn, createdAt || value);
}

function formatDateTimeLabel(value?: string | null, happenedOn?: string, createdAt?: string) {
  const date = new Date(getDisplayDateTime(value, happenedOn, createdAt));
  if (!date || Number.isNaN(date.getTime())) {
    return happenedOn || "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatRecord(record: {
  id: string;
  happened_on: string;
  happened_at?: string | null;
  created_at?: string;
  text: string;
  tags?: string[];
  growth_record_children?: Array<{
    child_id?: string;
    child_profiles?: { nickname?: string } | Array<{ nickname?: string }>;
  }>;
  growth_record_media?: Array<{
    media_type: string;
    signed_url?: string;
    signedUrl?: string;
    url?: string;
  }>;
}) {
  const tags = record.tags && record.tags.length ? record.tags : ["成长瞬间"];
  const childLabels = (record.growth_record_children || [])
    .map((link) => {
      const profile = Array.isArray(link.child_profiles)
        ? link.child_profiles[0]
        : link.child_profiles;
      return profile?.nickname || "";
    })
    .filter(Boolean);
  const happenedAt = getDisplayDateTime(record.happened_at, record.happened_on, record.created_at);
  return {
    id: record.id,
    date: record.happened_on,
    happenedAt,
    dateTimeLabel: formatDateTimeLabel(record.happened_at, record.happened_on, record.created_at),
    createdAt: record.created_at || "",
    title: tags[0],
    text: record.text,
    tags,
    childLabels,
    childLabel: childLabels.length ? childLabels.join("、") : "",
    photoUrls: (record.growth_record_media || [])
      .filter((media) => media.media_type === "photo" && (media.signed_url || media.signedUrl || media.url))
      .map((media) => (media.signed_url || media.signedUrl || media.url) as string),
    shareImageUrl: ""
  };
}

function getRecordCategory(record: { tags?: string[] }) {
  return record.tags?.[0] || "成长瞬间";
}

function filterRecords<T extends {
  date: string;
  title: string;
  text: string;
  tags?: string[];
}>(
  records: T[],
  filters: {
    startDate?: string;
    endDate?: string;
    category?: string;
    keyword?: string;
  }
) {
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

function buildReportRecordSummary(records: Array<{
  date?: string;
  dateTimeLabel?: string;
  title?: string;
  text?: string;
  childLabel?: string;
}>) {
  return records.slice(0, 12).map((record, index) => {
    const childText = record.childLabel ? `，关联${record.childLabel}` : "";
    return `${index + 1}. ${record.dateTimeLabel || record.date || ""}${childText}：${record.title || "成长瞬间"} - ${(record.text || "").slice(0, 80)}`;
  }).join("\n");
}

function sortRecords<T extends { date: string; happenedAt?: string; createdAt?: string }>(records: T[]) {
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

function mergeCachedMedia(
  nextRecords: Array<{
    id: string;
    date: string;
    happenedAt?: string;
    dateTimeLabel?: string;
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
    happenedAt?: string;
    dateTimeLabel?: string;
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
      current.happenedAt === record.happenedAt &&
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
    recordScopeOptions,
    selectedRecordScopeIndex: 1,
    children: [] as ArchiveChild[],
    selectedChildIds: [] as string[],
    shareRecord: null as null | {
      id: string;
      title: string;
      text: string;
      date?: string;
      dateTimeLabel?: string;
      imageUrl?: string;
    },
    selectedPhotoName: "",
    selectedPhotoPath: "",
    selectedPhotos: [] as Array<{ name: string; path: string }>,
    happenedDate: todayString(),
    happenedTime: currentTimeString(),
    allRecords: [] as unknown[],
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

      const currentAllRecords = this.data.allRecords as Array<{
        id: string;
        shareImageUrl?: string;
      }>;
      const nextRecords = currentAllRecords.map((item) =>
        updates.has(item.id) ? { ...item, shareImageUrl: updates.get(item.id) } : item
      );

      wx.setStorageSync(growthRecordsCacheStorageKey, {
        savedAt: Date.now(),
        records: nextRecords
      });

      const changed = nextRecords.some((item, index) => {
        const current = currentAllRecords[index];
        return item.shareImageUrl !== current?.shareImageUrl;
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
    this.loadChildren();
    this.consumePrefilledRecord();
    const usedCache = this.hydrateRecordCache();
    this.loadRecords({ useLoadingState: !usedCache, skipIfFresh: usedCache });
  },
  loadChildren() {
    void getJson<{ children: ArchiveChild[] }>("/api/children")
      .then((response) => {
        const rawChildren = response.children || [];
        const activeChildId = getActiveChildId() || rawChildren[0]?.id || "";
        if (activeChildId && !getActiveChildId()) {
          setActiveChildId(activeChildId);
        }
        const allChildIds = rawChildren.map((child) => child.id);
        const selectedChildIds = this.data.selectedChildIds.length
          ? this.data.selectedChildIds
          : allChildIds;
        const children = rawChildren.map((child) => ({
          ...child,
          avatarText: child.nickname.slice(0, 1),
          selected: selectedChildIds.includes(child.id)
        }));

        this.setData({
          children,
          selectedChildIds
        });
      })
      .catch(() => {});
  },
  hydrateRecordCache() {
    const cached = wx.getStorageSync(growthRecordsCacheStorageKey) as
      | {
          savedAt?: number;
          scopeIndex?: number;
          activeChildId?: string;
          records?: unknown[];
        }
      | undefined;

    if (!cached?.savedAt || !cached.records) {
      return false;
    }

    if (
      cached.scopeIndex !== this.data.selectedRecordScopeIndex ||
      (this.data.selectedRecordScopeIndex !== 1 && cached.activeChildId !== getActiveChildId())
    ) {
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
    const draft = wx.getStorageSync(growthRecordPrefillStorageKey) as
      | { text?: string; tags?: string }
      | undefined;

    if (!draft?.text) {
      return;
    }

    wx.removeStorageSync(growthRecordPrefillStorageKey);
    this.setData({
      isRecordComposerOpen: true,
      recordText: draft.text,
      recordCategory: (draft.tags || "成长瞬间").split(/[，,]/)[0] || "成长瞬间",
      selectedCategoryIndex: Math.max(
        0,
        recordCategories.indexOf((draft.tags || "成长瞬间").split(/[，,]/)[0] || "成长瞬间")
      )
    });
  },
  getFilteredRecords(records?: unknown[]) {
    return filterRecords(
      sortRecords((records || this.data.allRecords) as Array<{
        id: string;
        date: string;
        happenedAt?: string;
        createdAt?: string;
        title: string;
        text: string;
        tags: string[];
      }>),
      {
        startDate: this.data.filterStartDate,
        endDate: this.data.filterEndDate,
        category: this.data.filterCategoryOptions[this.data.selectedFilterCategoryIndex],
        keyword: this.data.filterKeyword
      }
    );
  },
  applyFilters() {
    this.setData({
      records: this.getFilteredRecords()
    });
  },
  toggleFilters() {
    this.setData({ isFilterOpen: !this.data.isFilterOpen });
  },
  onRecordScopeChange(event: { detail: { value: string | number } }) {
    this.switchRecordScope(Number(event.detail.value));
  },
  setFamilyRecordScope() {
    this.switchRecordScope(1);
  },
  setChildRecordScope() {
    this.switchRecordScope(0);
  },
  switchRecordScope(nextScopeIndex: number) {
    if (nextScopeIndex === this.data.selectedRecordScopeIndex) {
      return;
    }

    this.setData({
      selectedRecordScopeIndex: nextScopeIndex,
      hasRecordData: false,
      records: [],
      allRecords: []
    });
    wx.removeStorageSync(growthRecordsCacheStorageKey);
    this.loadRecords({ useLoadingState: true });
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

    const path =
      this.data.selectedRecordScopeIndex === 1
        ? "/api/growth-records?scope=family"
        : "/api/growth-records";

    void getJson<{
      records: Array<{
        id: string;
        happened_on: string;
        happened_at?: string | null;
        created_at?: string;
        text: string;
        tags?: string[];
        growth_record_children?: Array<{
          child_id?: string;
          child_profiles?: { nickname?: string } | Array<{ nickname?: string }>;
        }>;
        growth_record_media?: Array<{
          media_type: string;
          signed_url?: string;
          signedUrl?: string;
          url?: string;
        }>;
      }>;
    }>(path)
      .then((response) => {
        const records = mergeCachedMedia(
          (response.records || []).map(formatRecord),
          this.data.records as Array<{
            id: string;
            date: string;
            happenedAt?: string;
            dateTimeLabel?: string;
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
          scopeIndex: this.data.selectedRecordScopeIndex,
          activeChildId: this.data.selectedRecordScopeIndex === 1 ? "" : getActiveChildId(),
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
          hasRecordData: (this.data.records as unknown[]).length > 0,
          errorMessage:
            error.statusCode === 409 ? "请先完成首次配置" : error.error || "成长记录暂时无法同步"
        });
      });
  },
  onRecordTextInput(event: { detail: { value: string } }) {
    this.setData({ recordText: event.detail.value });
  },
  openRecordComposer() {
    const allChildIds = (this.data.children as ArchiveChild[]).map((child) => child.id);
    this.setData({
      isRecordComposerOpen: true,
      happenedDate: this.data.happenedDate || todayString(),
      happenedTime: this.data.happenedTime || currentTimeString(),
      selectedChildIds: this.data.selectedChildIds.length
        ? this.data.selectedChildIds
        : allChildIds,
      children: (this.data.children as ArchiveChild[]).map((child) => ({
        ...child,
        selected: (this.data.selectedChildIds.length
          ? this.data.selectedChildIds
          : allChildIds
        ).includes(child.id)
      }))
    });
  },
  closeRecordComposer() {
    if (this.data.isSubmitting) {
      return;
    }

    this.setData({ isRecordComposerOpen: false });
  },
  noop() {},
  toggleRecordChild(event: { currentTarget: { dataset: { id?: string } } }) {
    const childId = event.currentTarget.dataset.id;
    if (!childId) {
      return;
    }

    const selected = new Set(this.data.selectedChildIds as string[]);
    if (selected.has(childId)) {
      selected.delete(childId);
    } else {
      selected.add(childId);
    }

    if (!selected.size) {
      wx.showToast({ title: "至少关联一个孩子", icon: "none" });
      return;
    }

    const selectedChildIds = [...selected];
    this.setData({
      selectedChildIds,
      children: (this.data.children as ArchiveChild[]).map((child) => ({
        ...child,
        selected: selectedChildIds.includes(child.id)
      }))
    });
  },
  onRecordCategoryChange(event: { detail: { value: string } }) {
    const selectedCategoryIndex = Number(event.detail.value);
    this.setData({
      selectedCategoryIndex,
      recordCategory: recordCategories[selectedCategoryIndex] || "成长瞬间"
    });
  },
  onFilterStartDateChange(event: { detail: { value: string } }) {
    this.setData({ filterStartDate: event.detail.value });
    this.applyFilters();
  },
  onFilterEndDateChange(event: { detail: { value: string } }) {
    this.setData({ filterEndDate: event.detail.value });
    this.applyFilters();
  },
  onFilterCategoryChange(event: { detail: { value: string } }) {
    this.setData({ selectedFilterCategoryIndex: Number(event.detail.value) });
    this.applyFilters();
  },
  onFilterKeywordInput(event: { detail: { value: string } }) {
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
  onHappenedDateChange(event: { detail: { value: string } }) {
    this.setData({ happenedDate: event.detail.value });
  },
  onHappenedTimeChange(event: { detail: { value: string } }) {
    this.setData({ happenedTime: event.detail.value });
  },
  choosePhoto() {
    const selectedPhotos = this.data.selectedPhotos as Array<{ name: string; path: string }>;
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
            path: response.tempFiles?.[index]?.path || path
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
  removeSelectedPhoto(event: { currentTarget: { dataset: { index?: string | number } } }) {
    const index = Number(event.currentTarget.dataset.index);
    const selectedPhotos = [...(this.data.selectedPhotos as Array<{ name: string; path: string }>)] ;
    if (Number.isNaN(index)) {
      return;
    }

    selectedPhotos.splice(index, 1);
    this.setData({
      selectedPhotos
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
        dateTimeLabel: event.currentTarget.dataset.date || "",
        imageUrl: event.currentTarget.dataset.imageUrl || ""
      }
    });
  },
  generateMonthlyReport() {
    const isFamilyScope = this.data.selectedRecordScopeIndex === 1;
    const selectedRecords = this.data.records as Array<{
      date?: string;
      dateTimeLabel?: string;
      title?: string;
      text?: string;
      childLabel?: string;
    }>;
    const recordSummary = buildReportRecordSummary(selectedRecords);
    wx.setStorageSync(aiCoachPrefillStorageKey, {
      reportType: "monthly",
      scope: isFamilyScope ? "family" : "child",
      childId: getActiveChildId(),
      recordCount: selectedRecords.length,
      message: isFamilyScope
        ? `请基于我在成长档案当前选中的这些记录，产出一份家庭成长月报。重点看共同陪伴、每个孩子被看见的瞬间和下月温和建议，不要做孩子之间的排名或比较。\n\n选中的记录：\n${recordSummary}`
        : `请基于我在成长档案当前选中的这些记录，产出一份成长月报。按身体发展、阅读表达、兴趣培养、英语启蒙、情绪关系总结，并给出下月温和建议。\n\n选中的记录：\n${recordSummary}`
    });
    wx.switchTab({ url: "/pages/ai-coach/index" });
  },
  generateAnnualReport() {
    const selectedRecords = this.data.allRecords as Array<{
      date?: string;
      dateTimeLabel?: string;
      title?: string;
      text?: string;
      childLabel?: string;
    }>;
    const recordSummary = buildReportRecordSummary(selectedRecords);
    wx.setStorageSync(aiCoachPrefillStorageKey, {
      reportType: "annual",
      scope: "family",
      childId: getActiveChildId(),
      recordCount: selectedRecords.length,
      message:
        `请基于我在成长档案里选中的这些全家成长记录，生成一份年度家庭成长报告。必须包含章节：关键成长瞬间、共同瞬间、能力变化、父母寄语、下一年温和陪伴建议。共同瞬间要整理家庭一起完成或多个孩子共同参与的记录；父母寄语要用温暖、具体、不说教的口吻写给孩子和全家。不要排名或比较孩子。\n\n选中的记录：\n${recordSummary}`
    });
    wx.switchTab({ url: "/pages/ai-coach/index" });
  },
  addRecord() {
    const text = this.data.recordText.trim();
    if (!text) {
      wx.showToast({ title: "先写一句记录", icon: "none" });
      return;
    }

    const tags = [this.data.recordCategory || "成长瞬间"];
    const childIds = (this.data.selectedChildIds as string[]).length
      ? (this.data.selectedChildIds as string[])
      : (this.data.children as ArchiveChild[]).map((child) => child.id);

    this.setData({ isSubmitting: true });
    void postJson<{
      record?: {
        id: string;
      };
    }>("/api/growth-records", {
      happenedOn: this.data.happenedDate || todayString(),
      happenedAt: buildLocalDateTime(
        this.data.happenedDate || todayString(),
        this.data.happenedTime || currentTimeString()
      ),
      text,
      tags: tags.length ? tags : ["成长瞬间"],
      childIds
    })
      .then((response) => {
        const selectedPhotos = this.data.selectedPhotos as Array<{ path: string }>;
        if (!selectedPhotos.length || !response.record?.id) {
          return response;
        }

        return selectedPhotos.reduce(
          (promise, photo) =>
            promise.then(() =>
              uploadFile(`/api/growth-records/${response.record?.id}/media`, photo.path)
            ),
          Promise.resolve<unknown>(response)
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
          selectedChildIds: (this.data.children as ArchiveChild[]).map((child) => child.id),
          happenedDate: todayString(),
          happenedTime: currentTimeString()
        });
        this.loadRecords();
      })
      .catch((error) => {
        wx.showToast({ title: error.error || "记录未成功", icon: "none" });
      })
      .finally(() => {
        this.setData({ isSubmitting: false });
      });
  }
});
