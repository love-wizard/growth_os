"use strict";
var import_api = require("../../services/api");
const growthRecordPrefillStorageKey = "growth_os_growth_record_prefill";
const growthRecordsCacheStorageKey = "growth_os_growth_records_cache_v6";
const aiCoachPrefillStorageKey = "growth_os_ai_coach_prefill";
const growthRecordsCacheRefreshMs = 5 * 60 * 1e3;
const growthRecordsCacheDisplayMs = 55 * 60 * 1e3;
const growthRecordsPageSize = 20;
const recordCategories = ["成长瞬间", "运动健康", "阅读表达", "英语启蒙", "兴趣培养", "情绪关系", "户外探索"];
const recordScopeOptions = ["默认孩子", "全家"];
const courseOutcomeLabels = {
  completed: "已完成",
  missed: "缺席",
  cancelled: "取消",
  rescheduled: "改期"
};
const playbackChromeAutoHideMs = 1600;
let playbackTypeTimer = null;
let playbackAdvanceTimer = null;
let playbackChromeTimer = null;
let playbackSessionToken = 0;
function todayString() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function formatDateString(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function currentMonthStartString() {
  const now = /* @__PURE__ */ new Date();
  return formatDateString(new Date(now.getFullYear(), now.getMonth(), 1));
}
function currentMonthEndString() {
  const now = /* @__PURE__ */ new Date();
  return formatDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}
function currentTimeString() {
  const now = /* @__PURE__ */ new Date();
  return `${now.getHours()}`.padStart(2, "0") + ":" + `${now.getMinutes()}`.padStart(2, "0");
}
function currentSecondString() {
  return `${(/* @__PURE__ */ new Date()).getSeconds()}`.padStart(2, "0");
}
function timeStringFromDateTime(value) {
  if (!value) {
    return currentTimeString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return currentTimeString();
  }
  return `${date.getHours()}`.padStart(2, "0") + ":" + `${date.getMinutes()}`.padStart(2, "0");
}
function shouldShowAnnualReport(referenceDate = /* @__PURE__ */ new Date()) {
  return referenceDate.getMonth() === 11 && referenceDate.getDate() >= 15;
}
function buildLocalDateTime(date, time, seconds = currentSecondString()) {
  const [hours = "00", minutes = "00"] = time.split(":");
  return (/* @__PURE__ */ new Date(`${date}T${hours}:${minutes}:${seconds}`)).toISOString();
}
function isMidnight(value) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;
}
function combineDateWithTime(dateValue, timeSource) {
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
function getDisplayDateTime(value, happenedOn, createdAt) {
  if (value && !isMidnight(value)) {
    return value;
  }
  return combineDateWithTime(happenedOn, createdAt || value);
}
function formatDateTimeLabel(value, happenedOn, createdAt) {
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
function formatRecord(record) {
  const tags = record.tags && record.tags.length ? record.tags : ["成长瞬间"];
  const childLabels = (record.growth_record_children || []).map((link) => {
    const profile = Array.isArray(link.child_profiles) ? link.child_profiles[0] : link.child_profiles;
    return (profile == null ? void 0 : profile.nickname) || "";
  }).filter(Boolean);
  const happenedAt = getDisplayDateTime(record.happened_at, record.happened_on, record.created_at);
  return {
    id: record.id,
    itemKind: "growth",
    date: record.happened_on,
    happenedAt,
    dateTimeLabel: formatDateTimeLabel(record.happened_at, record.happened_on, record.created_at),
    createdAt: record.created_at || "",
    title: tags[0],
    primaryTag: tags[0],
    secondaryTags: tags.slice(1),
    text: record.text,
    tags,
    childLabels,
    childLabel: childLabels.length ? childLabels.join("、") : "",
    photoUrls: (record.growth_record_media || []).filter((media) => media.media_type === "photo" && (media.signed_url || media.signedUrl || media.url)).map((media) => media.signed_url || media.signedUrl || media.url),
    shareImageUrl: ""
  };
}
function normalizeJoinedOne(value) {
  return Array.isArray(value) ? value[0] : value;
}
function formatCourseRecord(record) {
  const interest = normalizeJoinedOne(record.child_interests);
  const childProfile = normalizeJoinedOne(record.child_profiles);
  const interestName = (interest == null ? void 0 : interest.name) || "课程";
  const outcomeLabel = courseOutcomeLabels[record.participation_outcome] || "已记录";
  const duration = record.duration_minutes ? `${record.duration_minutes}分钟` : "";
  const count = record.count ? `${record.count}次` : "";
  const detailParts = [outcomeLabel, duration || count, record.notes || ""].filter(Boolean);
  return {
    id: `course-${record.id}`,
    sourceId: record.id,
    itemKind: "course",
    date: record.happened_on,
    happenedAt: getDisplayDateTime(record.happened_at, record.happened_on),
    dateTimeLabel: formatDateTimeLabel(record.happened_at, record.happened_on),
    createdAt: "",
    title: `${interestName}课程`,
    primaryTag: "课程记录",
    secondaryTags: [],
    text: detailParts.join(" · "),
    tags: ["课程记录", interestName],
    childLabels: (childProfile == null ? void 0 : childProfile.nickname) ? [childProfile.nickname] : [],
    childLabel: (childProfile == null ? void 0 : childProfile.nickname) || "",
    photoUrls: [],
    shareImageUrl: ""
  };
}
function formatGrowthReport(report) {
  const label = report.report_type === "annual" ? "成长年报" : "成长月报";
  const sourceText = `基于 ${report.source_record_count || 0} 条成长瞬间和 ${report.source_course_record_count || 0} 条课程记录生成`;
  return {
    id: `report-${report.id}`,
    sourceId: report.id,
    itemKind: "report",
    date: report.period_end,
    happenedAt: combineDateWithTime(report.period_end, report.created_at),
    dateTimeLabel: report.period_end,
    createdAt: report.created_at || "",
    title: report.title || label,
    primaryTag: label,
    secondaryTags: [report.scope === "family" ? "全家" : "当前孩子"],
    text: report.summary || sourceText,
    tags: [label],
    childLabels: [],
    childLabel: "",
    photoUrls: [],
    shareImageUrl: "",
    sourceText
  };
}
function getRecordCategory(record) {
  var _a;
  return ((_a = record.tags) == null ? void 0 : _a[0]) || "成长瞬间";
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
function buildReportRecordSummary(records) {
  return records.slice(0, 12).map((record, index) => {
    const childText = record.childLabel ? `，关联${record.childLabel}` : "";
    const typeText = record.itemKind === "course" ? "课程记录" : "成长瞬间";
    return `${index + 1}. ${record.dateTimeLabel || record.date || ""}${childText}：${typeText}｜${record.title || "成长瞬间"} - ${(record.text || "").slice(0, 80)}`;
  }).join("\n");
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
function sortRecordsAscending(records) {
  return [...records].sort((left, right) => {
    const leftTime = left.happenedAt || left.createdAt || left.date;
    const rightTime = right.happenedAt || right.createdAt || right.date;
    if (leftTime !== rightTime) {
      return leftTime.localeCompare(rightTime);
    }
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }
    return (left.createdAt || "").localeCompare(right.createdAt || "");
  });
}
function clearPlaybackTimers() {
  if (playbackTypeTimer) {
    clearTimeout(playbackTypeTimer);
    playbackTypeTimer = null;
  }
  if (playbackAdvanceTimer) {
    clearTimeout(playbackAdvanceTimer);
    playbackAdvanceTimer = null;
  }
}
function clearPlaybackChromeTimer() {
  if (playbackChromeTimer) {
    clearTimeout(playbackChromeTimer);
    playbackChromeTimer = null;
  }
}
function getPlaybackTypingInterval(text) {
  const length = Array.from(text).length;
  if (length >= 80) {
    return 28;
  }
  if (length >= 40) {
    return 36;
  }
  return 48;
}
function getPlaybackDwellMs(text, hasPhoto) {
  const length = Array.from((text || "").trim()).length;
  if (!length) {
    return hasPhoto ? 1600 : 2200;
  }
  if (length <= 24) {
    return 2200;
  }
  if (length <= 56) {
    return 3e3;
  }
  if (length <= 96) {
    return 3800;
  }
  return 4600;
}
function getPlaybackPhotoFrameDwellMs(photoCount) {
  if (photoCount >= 4) {
    return 1100;
  }
  return 1400;
}
function buildPlaybackMoments(records) {
  return sortRecordsAscending(
    records.filter((record) => record.itemKind !== "report")
  ).reduce((moments, record) => {
    const photoUrls = (record.photoUrls || []).filter(Boolean);
    const baseMoment = {
      dateLabel: record.dateTimeLabel || record.date,
      tagLabel: record.itemKind === "course" ? "课程记录" : record.primaryTag || record.title || "成长瞬间",
      title: record.itemKind === "course" ? record.title || "课程记录" : "",
      childLabel: record.childLabel || ""
    };
    const text = (record.text || "").trim();
    if (!photoUrls.length) {
      moments.push({
        ...baseMoment,
        id: record.id,
        recordId: record.id,
        text,
        photoUrl: "",
        frameLabel: "",
        shouldTypeText: Boolean(text),
        advanceDelayMs: getPlaybackDwellMs(text, false)
      });
      return moments;
    }
    photoUrls.forEach((photoUrl, photoIndex) => {
      const isFirstPhoto = photoIndex === 0;
      moments.push({
        ...baseMoment,
        id: `${record.id}-${photoIndex + 1}`,
        recordId: record.id,
        text,
        photoUrl,
        frameLabel: photoUrls.length > 1 ? `${photoIndex + 1} / ${photoUrls.length}` : "",
        shouldTypeText: isFirstPhoto && Boolean(text),
        advanceDelayMs: isFirstPhoto ? getPlaybackDwellMs(text, true) : getPlaybackPhotoFrameDwellMs(photoUrls.length)
      });
    });
    return moments;
  }, []);
}
function mergeCachedMedia(nextRecords, currentRecords) {
  const currentById = new Map(currentRecords.map((record) => [record.id, record]));
  return sortRecords(nextRecords).map((record) => {
    var _a;
    const current = currentById.get(record.id);
    if (!current) {
      return {
        ...record,
        photoUrls: record.photoUrls || []
      };
    }
    const isSameRecord = current.date === record.date && current.happenedAt === record.happenedAt && current.title === record.title && current.text === record.text && JSON.stringify(current.tags || []) === JSON.stringify(record.tags || []);
    if (!isSameRecord) {
      return {
        ...record,
        photoUrls: record.photoUrls || []
      };
    }
    return {
      ...record,
      photoUrls: ((_a = record.photoUrls) == null ? void 0 : _a.length) ? record.photoUrls : current.photoUrls || [],
      shareImageUrl: current.shareImageUrl || record.shareImageUrl
    };
  });
}
function mergeRecordPages(nextRecords, currentRecords) {
  const merged = /* @__PURE__ */ new Map();
  mergeCachedMedia(nextRecords, currentRecords).forEach((record) => {
    merged.set(record.id, {
      ...record,
      photoUrls: record.photoUrls || []
    });
  });
  return sortRecords([...merged.values()]);
}
Page({
  data: {
    isLoading: false,
    hasRecordData: false,
    isSubmitting: false,
    isRecordComposerOpen: false,
    composerMode: "create",
    isFilterOpen: false,
    errorMessage: "",
    editingRecordId: "",
    editingRecordTags: [],
    recordText: "",
    recordCategory: "成长瞬间",
    selectedCategoryIndex: 0,
    recordCategories,
    filterCategoryOptions: ["全部", ...recordCategories],
    selectedFilterCategoryIndex: 0,
    filterStartDate: currentMonthStartString(),
    filterEndDate: currentMonthEndString(),
    filterKeyword: "",
    isLoadingMoreRecords: false,
    hasMoreRecords: false,
    showAnnualReport: shouldShowAnnualReport(),
    nextRecordsOffset: 0,
    recordScopeOptions,
    selectedRecordScopeIndex: 1,
    children: [],
    selectedChildIds: [],
    failedPhotoUrls: [],
    shareRecord: null,
    selectedPhotoName: "",
    selectedPhotoPath: "",
    selectedPhotos: [],
    happenedDate: todayString(),
    happenedTime: currentTimeString(),
    isPlaybackOpen: false,
    playbackMoments: [],
    playbackIndex: 0,
    playbackCounterText: "",
    playbackProgressStyle: "width: 0%;",
    playbackCurrentDate: "",
    playbackCurrentTag: "",
    playbackCurrentTitle: "",
    playbackCurrentChildLabel: "",
    playbackCurrentFrameLabel: "",
    playbackCurrentPhotoUrl: "",
    playbackTypedText: "",
    playbackIsTyping: false,
    playbackChromeVisible: true,
    allRecords: [],
    courseRecords: [],
    records: []
  },
  preloadShareImages(records) {
    const preloadTargets = records.filter((record) => {
      var _a;
      return ((_a = record.photoUrls) == null ? void 0 : _a[0]) && !record.shareImageUrl;
    }).slice(0, 3);
    if (!preloadTargets.length) {
      return;
    }
    void Promise.all(
      preloadTargets.map(
        (record) => new Promise((resolve) => {
          var _a;
          wx.getImageInfo({
            src: ((_a = record.photoUrls) == null ? void 0 : _a[0]) || "",
            success: (result) => {
              resolve({ id: record.id, shareImageUrl: result.path });
            },
            fail: () => resolve(null)
          });
        })
      )
    ).then((results) => {
      const updates = new Map(
        results.filter(
          (result) => Boolean((result == null ? void 0 : result.id) && result.shareImageUrl)
        ).map((result) => [result.id, result.shareImageUrl])
      );
      if (!updates.size) {
        return;
      }
      const currentAllRecords = this.data.allRecords;
      const nextRecords = currentAllRecords.map(
        (item) => updates.has(item.id) ? { ...item, shareImageUrl: updates.get(item.id) } : item
      );
      wx.setStorageSync(growthRecordsCacheStorageKey, {
        savedAt: Date.now(),
        scopeIndex: this.data.selectedRecordScopeIndex,
        activeChildId: this.data.selectedRecordScopeIndex === 1 ? "" : (0, import_api.getActiveChildId)(),
        hasMoreRecords: this.data.hasMoreRecords,
        nextRecordsOffset: this.data.nextRecordsOffset,
        courseRecords: this.data.courseRecords,
        records: nextRecords
      });
      const changed = nextRecords.some((item, index) => {
        const current = currentAllRecords[index];
        return item.shareImageUrl !== (current == null ? void 0 : current.shareImageUrl);
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
      path: `/pages/record-preview/index?recordId=${shareRecord.id}&text=${encodeURIComponent(shareRecord.text || "")}&date=${encodeURIComponent(shareRecord.dateTimeLabel || shareRecord.date || "")}&imageUrl=${encodeURIComponent(shareRecord.imageUrl || "")}`,
      imageUrl: shareRecord.imageUrl || void 0
    };
  },
  onShow() {
    this.setData({ showAnnualReport: shouldShowAnnualReport() });
    this.loadChildren();
    this.consumePrefilledRecord();
    const usedCache = this.hydrateRecordCache();
    this.loadRecords({ useLoadingState: !usedCache, skipIfFresh: usedCache });
  },
  onHide() {
    this.closePlayback();
  },
  onUnload() {
    this.closePlayback();
  },
  loadChildren() {
    void (0, import_api.getJson)("/api/children").then((response) => {
      var _a;
      const rawChildren = response.children || [];
      const activeChildId = (0, import_api.getActiveChildId)() || ((_a = rawChildren[0]) == null ? void 0 : _a.id) || "";
      if (activeChildId && !(0, import_api.getActiveChildId)()) {
        (0, import_api.setActiveChildId)(activeChildId);
      }
      const allChildIds = rawChildren.map((child) => child.id);
      const selectedChildIds = this.data.selectedChildIds.length ? this.data.selectedChildIds : allChildIds;
      const children = rawChildren.map((child) => ({
        ...child,
        avatarText: child.nickname.slice(0, 1),
        selected: selectedChildIds.includes(child.id)
      }));
      this.setData({
        children,
        selectedChildIds
      });
    }).catch(() => {
    });
  },
  hydrateRecordCache() {
    const cached = wx.getStorageSync(growthRecordsCacheStorageKey);
    if (!(cached == null ? void 0 : cached.savedAt) || !cached.records) {
      return false;
    }
    if (cached.scopeIndex !== this.data.selectedRecordScopeIndex || this.data.selectedRecordScopeIndex !== 1 && cached.activeChildId !== (0, import_api.getActiveChildId)()) {
      return false;
    }
    if (Date.now() - cached.savedAt > growthRecordsCacheDisplayMs) {
      return false;
    }
    this.setData({
      isLoading: false,
      hasRecordData: true,
      hasMoreRecords: Boolean(cached.hasMoreRecords),
      nextRecordsOffset: cached.nextRecordsOffset || (cached.records || []).length,
      courseRecords: cached.courseRecords || [],
      allRecords: cached.records,
      records: this.getFilteredRecords(cached.records)
    });
    return true;
  },
  consumePrefilledRecord() {
    const draft = wx.getStorageSync(growthRecordPrefillStorageKey);
    if (!(draft == null ? void 0 : draft.text)) {
      return;
    }
    wx.removeStorageSync(growthRecordPrefillStorageKey);
    this.setData({
      composerMode: "create",
      editingRecordId: "",
      editingRecordTags: [],
      isRecordComposerOpen: true,
      recordText: draft.text,
      recordCategory: (draft.tags || "成长瞬间").split(/[，,]/)[0] || "成长瞬间",
      selectedCategoryIndex: Math.max(
        0,
        recordCategories.indexOf((draft.tags || "成长瞬间").split(/[，,]/)[0] || "成长瞬间")
      )
    });
  },
  getFilteredRecords(records) {
    return filterRecords(
      sortRecords(records || this.data.allRecords),
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
  setPlaybackChromeVisible(visible, autoHide = false) {
    void visible;
    void autoHide;
  },
  revealPlaybackChrome() {
    return;
  },
  onPlaybackStageTap() {
    return;
  },
  schedulePlaybackAdvance(sessionToken, moment) {
    playbackAdvanceTimer = setTimeout(() => {
      this.advancePlayback(sessionToken);
    }, moment.advanceDelayMs);
  },
  startPlayback() {
    const playbackMoments = buildPlaybackMoments(this.data.records);
    if (!playbackMoments.length) {
      wx.showToast({ title: "先筛出想回看的成长瞬间", icon: "none" });
      return;
    }
    playbackSessionToken += 1;
    clearPlaybackTimers();
    clearPlaybackChromeTimer();
    this.setData({
      isPlaybackOpen: true,
      playbackMoments,
      playbackIndex: 0,
      playbackCounterText: "",
      playbackProgressStyle: "width: 0%;",
      playbackCurrentDate: "",
      playbackCurrentTag: "",
      playbackCurrentTitle: "",
      playbackCurrentChildLabel: "",
      playbackCurrentFrameLabel: "",
      playbackCurrentPhotoUrl: "",
      playbackTypedText: "",
      playbackIsTyping: false,
      playbackChromeVisible: true
    });
    this.renderPlaybackMoment(0, playbackSessionToken);
  },
  closePlayback() {
    playbackSessionToken += 1;
    clearPlaybackTimers();
    clearPlaybackChromeTimer();
    this.setData({
      isPlaybackOpen: false,
      playbackMoments: [],
      playbackIndex: 0,
      playbackCounterText: "",
      playbackProgressStyle: "width: 0%;",
      playbackCurrentDate: "",
      playbackCurrentTag: "",
      playbackCurrentTitle: "",
      playbackCurrentChildLabel: "",
      playbackCurrentFrameLabel: "",
      playbackCurrentPhotoUrl: "",
      playbackTypedText: "",
      playbackIsTyping: false,
      playbackChromeVisible: true
    });
  },
  skipPlaybackStep() {
    if (!this.data.isPlaybackOpen) {
      return;
    }
    const playbackMoments = this.data.playbackMoments;
    const currentMoment = playbackMoments[this.data.playbackIndex];
    if (!currentMoment) {
      this.closePlayback();
      return;
    }
    if (this.data.playbackTypedText !== currentMoment.text) {
      clearPlaybackTimers();
      this.setData({
        playbackTypedText: currentMoment.text,
        playbackIsTyping: false
      });
      this.revealPlaybackChrome();
      this.schedulePlaybackAdvance(playbackSessionToken, currentMoment);
      return;
    }
    this.revealPlaybackChrome();
    this.advancePlayback(playbackSessionToken);
  },
  renderPlaybackMoment(index, sessionToken) {
    if (sessionToken !== playbackSessionToken) {
      return;
    }
    const playbackMoments = this.data.playbackMoments;
    const currentMoment = playbackMoments[index];
    const previousMoment = index > 0 ? playbackMoments[index - 1] : null;
    if (!currentMoment) {
      this.closePlayback();
      return;
    }
    const isSameRecordAsPrevious = (previousMoment == null ? void 0 : previousMoment.recordId) === currentMoment.recordId;
    clearPlaybackTimers();
    this.setData({
      playbackIndex: index,
      playbackCounterText: `${index + 1} / ${playbackMoments.length}`,
      playbackProgressStyle: `width: ${(index + 1) / playbackMoments.length * 100}%;`,
      playbackCurrentDate: currentMoment.dateLabel,
      playbackCurrentTag: currentMoment.tagLabel,
      playbackCurrentTitle: currentMoment.title,
      playbackCurrentChildLabel: currentMoment.childLabel,
      playbackCurrentFrameLabel: currentMoment.frameLabel,
      playbackCurrentPhotoUrl: currentMoment.photoUrl,
      playbackTypedText: currentMoment.shouldTypeText ? "" : currentMoment.text,
      playbackIsTyping: currentMoment.shouldTypeText
    });
    if (!isSameRecordAsPrevious) {
      this.revealPlaybackChrome();
    }
    if (!currentMoment.shouldTypeText) {
      this.schedulePlaybackAdvance(sessionToken, currentMoment);
      return;
    }
    const characters = Array.from(currentMoment.text);
    const typingInterval = getPlaybackTypingInterval(currentMoment.text);
    const typeNextCharacter = (nextIndex) => {
      if (sessionToken !== playbackSessionToken) {
        return;
      }
      const typedText = characters.slice(0, nextIndex).join("");
      const finished = nextIndex >= characters.length;
      this.setData({
        playbackTypedText: typedText,
        playbackIsTyping: !finished
      });
      if (!finished) {
        playbackTypeTimer = setTimeout(() => {
          typeNextCharacter(nextIndex + 1);
        }, typingInterval);
        return;
      }
      this.schedulePlaybackAdvance(sessionToken, currentMoment);
    };
    playbackTypeTimer = setTimeout(() => {
      typeNextCharacter(1);
    }, typingInterval);
  },
  advancePlayback(sessionToken = playbackSessionToken) {
    if (sessionToken !== playbackSessionToken) {
      return;
    }
    const playbackMoments = this.data.playbackMoments;
    const nextIndex = this.data.playbackIndex + 1;
    if (nextIndex >= playbackMoments.length) {
      this.closePlayback();
      return;
    }
    this.renderPlaybackMoment(nextIndex, sessionToken);
  },
  toggleFilters() {
    this.setData({ isFilterOpen: !this.data.isFilterOpen });
  },
  onRecordScopeChange(event) {
    this.switchRecordScope(Number(event.detail.value));
  },
  setFamilyRecordScope() {
    this.switchRecordScope(1);
  },
  setChildRecordScope() {
    this.switchRecordScope(0);
  },
  switchRecordScope(nextScopeIndex) {
    if (nextScopeIndex === this.data.selectedRecordScopeIndex) {
      return;
    }
    this.setData({
      selectedRecordScopeIndex: nextScopeIndex,
      hasRecordData: false,
      hasMoreRecords: false,
      nextRecordsOffset: 0,
      records: [],
      allRecords: []
    });
    wx.removeStorageSync(growthRecordsCacheStorageKey);
    this.loadRecords({ useLoadingState: true });
  },
  loadRecords(options) {
    const append = Boolean(options == null ? void 0 : options.append);
    if (options == null ? void 0 : options.skipIfFresh) {
      const cached = wx.getStorageSync(growthRecordsCacheStorageKey);
      if ((cached == null ? void 0 : cached.savedAt) && Date.now() - cached.savedAt <= growthRecordsCacheRefreshMs) {
        return;
      }
    }
    if (append && (this.data.isLoadingMoreRecords || !this.data.hasMoreRecords)) {
      return;
    }
    if ((options == null ? void 0 : options.useLoadingState) !== false) {
      this.setData({ isLoading: true, errorMessage: "" });
    } else if (append) {
      this.setData({ isLoadingMoreRecords: true, errorMessage: "" });
    }
    const offset = append ? this.data.nextRecordsOffset || 0 : 0;
    const query = [`limit=${growthRecordsPageSize}`, `offset=${offset}`];
    if (this.data.selectedRecordScopeIndex === 1) {
      query.unshift("scope=family");
    }
    const path = query.length > 0 ? `/api/growth-records?${query.join("&")}` : "/api/growth-records";
    const coursePath = this.data.selectedRecordScopeIndex === 1 ? "/api/interest-participation-records?scope=family" : "/api/interest-participation-records";
    const reportPath = this.data.selectedRecordScopeIndex === 1 ? "/api/growth-reports?scope=family&reportType=monthly" : "/api/growth-reports?reportType=monthly";
    const growthRecordsPromise = (0, import_api.getJson)(path);
    const courseRecordsPromise = append ? Promise.resolve({ records: this.data.courseRecords }) : (0, import_api.getJson)(coursePath).then((response) => ({
      records: (response.records || []).map(formatCourseRecord)
    }));
    const reportRecordsPromise = append ? Promise.resolve({ records: this.data.reportRecords || [] }) : (0, import_api.getJson)(reportPath).then((response) => ({
      records: (response.reports || []).map(formatGrowthReport)
    }));
    void Promise.all([growthRecordsPromise, courseRecordsPromise, reportRecordsPromise]).then(([response, courseResponse, reportResponse]) => {
      var _a;
      const currentRecords = append ? this.data.allRecords : [];
        const incomingRecords = (response.records || []).filter(
          (record) => record.draft_status !== "draft"
        ).map(formatRecord);
      const courseRecords = courseResponse.records || [];
      const reportRecords = reportResponse.records || [];
      const records = append ? mergeRecordPages([...currentRecords, ...incomingRecords], currentRecords) : mergeCachedMedia(
        [...incomingRecords, ...courseRecords, ...reportRecords],
        this.data.records
      );
      const filterStartDate = append ? "" : this.data.filterStartDate;
      const filterEndDate = append ? "" : this.data.filterEndDate;
      const hasMoreRecords = Boolean(response.hasMore);
      const nextRecordsOffset = (_a = response.nextOffset) != null ? _a : records.length;
      wx.setStorageSync(growthRecordsCacheStorageKey, {
        savedAt: Date.now(),
        scopeIndex: this.data.selectedRecordScopeIndex,
        activeChildId: this.data.selectedRecordScopeIndex === 1 ? "" : (0, import_api.getActiveChildId)(),
        hasMoreRecords,
        nextRecordsOffset,
        courseRecords,
        reportRecords,
        records
      });
      this.setData({
        isLoading: false,
        isLoadingMoreRecords: false,
        hasRecordData: true,
        hasMoreRecords,
        nextRecordsOffset,
        filterStartDate,
        filterEndDate,
        courseRecords,
        reportRecords,
        allRecords: records,
        records: filterRecords(
          sortRecords(records),
          {
            startDate: filterStartDate,
            endDate: filterEndDate,
            category: this.data.filterCategoryOptions[this.data.selectedFilterCategoryIndex],
            keyword: this.data.filterKeyword
          }
        )
      });
      this.preloadShareImages(records);
    }).catch((error) => {
      this.setData({
        isLoading: false,
        isLoadingMoreRecords: false,
        hasRecordData: this.data.records.length > 0,
        errorMessage: error.statusCode === 409 ? "请先完成首次配置" : error.error || "成长记录暂时无法同步"
      });
    });
  },
  loadMoreRecords() {
    if (!this.data.hasMoreRecords && this.data.allRecords.length > this.data.records.length) {
      const records = sortRecords(this.data.allRecords);
      this.setData({
        filterStartDate: "",
        filterEndDate: "",
        records: filterRecords(records, {
          category: this.data.filterCategoryOptions[this.data.selectedFilterCategoryIndex],
          keyword: this.data.filterKeyword
        })
      });
      return;
    }
    this.loadRecords({ useLoadingState: false, append: true });
  },
  onReachBottom() {
    this.loadMoreRecords();
  },
  onRecordTextInput(event) {
    this.setData({ recordText: event.detail.value });
  },
  resetRecordComposer() {
    this.setData({
      composerMode: "create",
      editingRecordId: "",
      editingRecordTags: [],
      isRecordComposerOpen: false,
      recordText: "",
      recordCategory: "成长瞬间",
      selectedCategoryIndex: 0,
      selectedPhotoName: "",
      selectedPhotoPath: "",
      selectedPhotos: [],
      selectedChildIds: this.data.children.map((child) => child.id),
      happenedDate: todayString(),
      happenedTime: currentTimeString(),
      children: this.data.children.map((child) => ({
        ...child,
        selected: true
      }))
    });
  },
  openRecordComposer() {
    const allChildIds = this.data.children.map((child) => child.id);
    this.setData({
      composerMode: "create",
      editingRecordId: "",
      editingRecordTags: [],
      isRecordComposerOpen: true,
      recordText: "",
      recordCategory: "成长瞬间",
      selectedCategoryIndex: 0,
      selectedPhotoName: "",
      selectedPhotoPath: "",
      selectedPhotos: [],
      happenedDate: this.data.happenedDate || todayString(),
      happenedTime: this.data.happenedTime || currentTimeString(),
      selectedChildIds: allChildIds,
      children: this.data.children.map((child) => ({
        ...child,
        selected: allChildIds.includes(child.id)
      }))
    });
  },
  openEditRecord(recordId) {
    const record = this.data.allRecords.find((item) => item.id === recordId && item.itemKind !== "course");
    if (!record) {
      wx.showToast({ title: "这条记录暂时不能编辑", icon: "none" });
      return;
    }
    const primaryTag = (record.tags == null ? void 0 : record.tags[0]) || "成长瞬间";
    const selectedCategoryIndex = Math.max(0, recordCategories.indexOf(primaryTag));
    this.setData({
      composerMode: "edit",
      editingRecordId: record.id,
      editingRecordTags: record.tags || [],
      isRecordComposerOpen: true,
      recordText: record.text || "",
      recordCategory: primaryTag,
      selectedCategoryIndex,
      selectedPhotoName: "",
      selectedPhotoPath: "",
      selectedPhotos: [],
      happenedDate: record.date || todayString(),
      happenedTime: timeStringFromDateTime(record.happenedAt),
      selectedChildIds: this.data.selectedChildIds.length ? this.data.selectedChildIds : this.data.children.map((child) => child.id)
    });
  },
  closeRecordComposer() {
    if (this.data.isSubmitting) {
      return;
    }
    this.resetRecordComposer();
  },
  noop() {
  },
  toggleRecordChild(event) {
    const childId = event.currentTarget.dataset.id;
    if (!childId) {
      return;
    }
    const selected = new Set(this.data.selectedChildIds);
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
      children: this.data.children.map((child) => ({
        ...child,
        selected: selectedChildIds.includes(child.id)
      }))
    });
  },
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
      filterStartDate: currentMonthStartString(),
      filterEndDate: currentMonthEndString(),
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
        const nextPhotos = (response.tempFilePaths || []).map((path, index) => {
          var _a, _b;
          return {
            name: path.split("/").pop() || `成长照片${selectedPhotos.length + index + 1}.jpg`,
            path: ((_b = (_a = response.tempFiles) == null ? void 0 : _a[index]) == null ? void 0 : _b.path) || path
          };
        }).filter((photo) => photo.path);
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
  handleRecordPhotoError(event) {
    const failedUrl = event.currentTarget.dataset.current || "";
    const failedPhotoUrls = this.data.failedPhotoUrls;
    if (!failedUrl || failedPhotoUrls.includes(failedUrl)) {
      return;
    }
    this.setData({
      failedPhotoUrls: [...failedPhotoUrls, failedUrl]
    });
    wx.removeStorageSync(growthRecordsCacheStorageKey);
    this.loadRecords({ useLoadingState: false });
  },
  prepareShareRecord(event) {
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
  openRecordActions(event) {
    const recordId = event.currentTarget.dataset.id;
    if (!recordId) {
      return;
    }
    if (!wx.showActionSheet) {
      this.openEditRecord(recordId);
      return;
    }
    wx.showActionSheet({
      itemList: ["编辑记录", "删除记录"],
      success: (result) => {
        if (result.tapIndex === 0) {
          this.openEditRecord(recordId);
          return;
        }
        if (result.tapIndex === 1) {
          this.confirmDeleteRecord(recordId);
        }
      }
    });
  },
  confirmDeleteRecord(recordId) {
    if (!recordId) {
      return;
    }
    wx.showModal({
      title: "删除记录",
      content: "删除后可在恢复窗口内撤回，确认删除这条记录吗？",
      success: (result) => {
        if (!result.confirm) {
          return;
        }
        (0, import_api.deleteJson)(`/api/growth-records/${recordId}`)
          .then(() => {
            wx.showToast({ title: "已删除", icon: "success" });
            wx.removeStorageSync(growthRecordsCacheStorageKey);
            this.loadRecords({ useLoadingState: false });
          })
          .catch((error) => {
            wx.showToast({ title: error.error || "删除未成功", icon: "none" });
          });
      }
    });
  },
  deleteRecord(event) {
    this.confirmDeleteRecord(event.currentTarget.dataset.id || "");
  },
  generateMonthlyReport() {
    const isFamilyScope = this.data.selectedRecordScopeIndex === 1;
    wx.showLoading({ title: "生成月报中" });
    void (0, import_api.postJson)("/api/growth-reports/monthly", {
      scope: isFamilyScope ? "family" : "child",
      childId: (0, import_api.getActiveChildId)(),
      periodStart: currentMonthStartString(),
      periodEnd: currentMonthEndString()
    }).then((response) => {
      var _a;
      wx.hideLoading();
      wx.removeStorageSync(growthRecordsCacheStorageKey);
      this.loadRecords({ useLoadingState: false });
      if ((_a = response.report) == null ? void 0 : _a.id) {
        wx.navigateTo({ url: `/pages/report-detail/index?reportId=${response.report.id}` });
      }
    }).catch((error) => {
      wx.hideLoading();
      wx.showToast({ title: error.error || "月报生成失败", icon: "none" });
    });
  },
  generateAnnualReport() {
    const selectedRecords = this.data.allRecords;
    const recordSummary = buildReportRecordSummary(selectedRecords);
    wx.setStorageSync(aiCoachPrefillStorageKey, {
      reportType: "annual",
      scope: "family",
      childId: (0, import_api.getActiveChildId)(),
      recordCount: selectedRecords.length,
      message: `请基于我在成长档案里选中的这些全家成长记录，生成一份年度家庭成长报告。记录中可能同时包含成长瞬间和课程记录。必须包含章节：关键成长瞬间、共同瞬间、课程与兴趣变化、能力变化、父母寄语、下一年温和陪伴建议。共同瞬间要整理家庭一起完成或多个孩子共同参与的记录；课程记录要看持续性、状态变化和压力信号；父母寄语要用温暖、具体、不说教的口吻写给孩子和全家。不要排名或比较孩子。

选中的记录：
${recordSummary}`
    });
    wx.switchTab({ url: "/pages/ai-coach/index" });
  },
  openReportDetail(event) {
    const reportId = event.currentTarget.dataset.id;
    if (!reportId) {
      return;
    }
    wx.navigateTo({ url: `/pages/report-detail/index?reportId=${reportId}` });
  },
  addRecord() {
    if (this.data.isSubmitting) {
      return;
    }
    const text = this.data.recordText.trim();
    if (!text) {
      wx.showToast({ title: "先写一句记录", icon: "none" });
      return;
    }
    const primaryTag = this.data.recordCategory || "成长瞬间";
    const tags = this.data.composerMode === "edit" ? [
      primaryTag,
      ...this.data.editingRecordTags.filter((tag, index) => index > 0 && tag !== primaryTag)
    ] : [primaryTag];
    const childIds = this.data.selectedChildIds.length ? this.data.selectedChildIds : this.data.children.map((child) => child.id);
    const isEditing = this.data.composerMode === "edit" && Boolean(this.data.editingRecordId);
    this.setData({ isSubmitting: true });
    const request = isEditing ? (0, import_api.patchJson)(`/api/growth-records/${this.data.editingRecordId}`, {
      happenedOn: this.data.happenedDate || todayString(),
      text,
      tags: tags.length ? tags : ["成长瞬间"],
      draftStatus: "saved"
    }) : (0, import_api.postJson)("/api/growth-records", {
      happenedOn: this.data.happenedDate || todayString(),
      happenedAt: buildLocalDateTime(
        this.data.happenedDate || todayString(),
        this.data.happenedTime || currentTimeString()
      ),
      text,
      tags: tags.length ? tags : ["成长瞬间"],
      childIds
    });
    void request.then((response) => {
      var _a;
      if (isEditing) {
        return response;
      }
      const selectedPhotos = this.data.selectedPhotos;
      if (!selectedPhotos.length || !((_a = response.record) == null ? void 0 : _a.id)) {
        return response;
      }
      return selectedPhotos.reduce(
        (promise, photo) => promise.then(
          () => {
            var _a2;
            return (0, import_api.uploadFile)(`/api/growth-records/${(_a2 = response.record) == null ? void 0 : _a2.id}/media`, photo.path);
          }
        ),
        Promise.resolve(response)
      );
    }).then(() => {
      wx.showToast({ title: isEditing ? "已保存" : "已记录", icon: "success" });
      this.resetRecordComposer();
      wx.removeStorageSync(growthRecordsCacheStorageKey);
      this.loadRecords();
    }).catch((error) => {
      wx.showToast({ title: error.error || (isEditing ? "保存未成功" : "记录未成功"), icon: "none" });
    }).finally(() => {
      this.setData({ isSubmitting: false });
    });
  }
});
