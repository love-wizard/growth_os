"use strict";
var import_api = require("../../services/api");
function todayString() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function currentTimeString() {
  const now = /* @__PURE__ */ new Date();
  return `${now.getHours()}`.padStart(2, "0") + ":" + `${now.getMinutes()}`.padStart(2, "0");
}
function currentSecondString() {
  return `${(/* @__PURE__ */ new Date()).getSeconds()}`.padStart(2, "0");
}
function buildLocalDateTime(date, time, seconds = currentSecondString()) {
  const [hours = "00", minutes = "00"] = time.split(":");
  return (/* @__PURE__ */ new Date(`${date}T${hours}:${minutes}:${seconds}`)).toISOString();
}
function formatDateTimeLabel(value, fallbackDate) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return fallbackDate || "";
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
const outcomeOptions = [
  { value: "completed", label: "已完成" },
  { value: "missed", label: "缺席" },
  { value: "cancelled", label: "取消" },
  { value: "rescheduled", label: "改期" }
];
const outcomeLabels = outcomeOptions.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});
function formatRecord(record) {
  var _a;
  const duration = record.duration_minutes ? `${record.duration_minutes}分钟` : "";
  const count = record.count ? `${record.count}次` : "";
  return {
    id: record.id,
    date: record.happened_on,
    dateTimeLabel: formatDateTimeLabel(record.happened_at, record.happened_on),
    interestName: ((_a = record.child_interests) == null ? void 0 : _a.name) || "兴趣活动",
    outcomeLabel: outcomeLabels[record.participation_outcome] || "已记录",
    outcome: record.participation_outcome,
    detail: record.notes || "",
    badge: duration || count,
    durationMinutes: record.duration_minutes || 0
  };
}
function buildSummary(records) {
  const completedRecords = records.filter((record) => record.outcome === "completed");
  const totalMinutes = completedRecords.reduce(
    (total, record) => total + (record.durationMinutes || 0),
    0
  );
  return {
    totalRecords: `${records.length}`,
    completedRecords: `${completedRecords.length}`,
    totalMinutes: `${totalMinutes}`,
    latestLabel: records[0] ? `${records[0].dateTimeLabel || records[0].date} · ${records[0].interestName}` : "还没有记录"
  };
}
Page({
  data: {
    isLoading: false,
    isSubmitting: false,
    errorMessage: "",
    children: [],
    selectedChildId: "",
    selectedChildName: "",
    interestOptions: [],
    records: [],
    summary: {
      totalRecords: "0",
      completedRecords: "0",
      totalMinutes: "0",
      latestLabel: "还没有记录"
    },
    outcomeOptions,
    selectedInterestId: "",
    selectedOutcome: "completed",
    happenedOn: todayString(),
    happenedTime: currentTimeString(),
    durationMinutes: "30",
    notes: ""
  },
  onShow() {
    void this.loadChildren().then(() => this.loadSnapshot());
  },
  loadChildren() {
    return (0, import_api.getJson)("/api/children").then((response) => {
      var _a, _b, _c;
      const rawChildren = response.children || [];
      const selectedChildId = this.data.selectedChildId || (0, import_api.getActiveChildId)() || ((_a = rawChildren[0]) == null ? void 0 : _a.id) || "";
      const selectedChildName = ((_b = rawChildren.find((child) => child.id === selectedChildId)) == null ? void 0 : _b.nickname) || ((_c = rawChildren[0]) == null ? void 0 : _c.nickname) || "";
      this.setData({
        children: rawChildren.map((child) => ({
          ...child,
          selected: child.id === selectedChildId
        })),
        selectedChildId,
        selectedChildName
      });
    }).catch(() => void 0);
  },
  loadSnapshot() {
    this.setData({ isLoading: true, errorMessage: "" });
    const childQuery = this.data.selectedChildId ? `?childId=${encodeURIComponent(this.data.selectedChildId)}` : "";
    void (0, import_api.getJson)(`/api/interest-participation-records${childQuery}`).then((response) => {
      var _a;
      const interestOptions = response.interests || [];
      const records = (response.records || []).map(formatRecord);
      this.setData({
        isLoading: false,
        interestOptions,
        selectedInterestId: this.data.selectedInterestId || ((_a = interestOptions[0]) == null ? void 0 : _a.id) || "",
        records,
        summary: buildSummary(records)
      });
    }).catch((error) => {
      this.setData({
        isLoading: false,
        errorMessage: error.statusCode === 409 ? "请先完成首次配置" : error.error || "课程记录暂时无法同步"
      });
    });
  },
  chooseChild(event) {
    const childId = event.currentTarget.dataset.id;
    if (!childId || childId === this.data.selectedChildId) {
      return;
    }
    const selectedChild = this.data.children.find((child) => child.id === childId);
    this.setData({
      selectedChildId: childId,
      selectedChildName: (selectedChild == null ? void 0 : selectedChild.nickname) || "",
      selectedInterestId: "",
      records: [],
      children: this.data.children.map((child) => ({
        ...child,
        selected: child.id === childId
      }))
    });
    this.loadSnapshot();
  },
  chooseInterest(event) {
    this.setData({ selectedInterestId: event.currentTarget.dataset.id });
  },
  onDateInput(event) {
    this.setData({ happenedOn: event.detail.value });
  },
  onTimeInput(event) {
    this.setData({ happenedTime: event.detail.value });
  },
  chooseOutcome(event) {
    const selectedOutcome = event.currentTarget.dataset.value;
    this.setData({
      selectedOutcome,
      durationMinutes: selectedOutcome === "completed" ? this.data.durationMinutes || "30" : ""
    });
  },
  onDurationInput(event) {
    this.setData({ durationMinutes: event.detail.value });
  },
  onNotesInput(event) {
    this.setData({ notes: event.detail.value });
  },
  saveRecord() {
    if (!this.data.selectedInterestId) {
      wx.showToast({ title: "先选择一个兴趣", icon: "none" });
      return;
    }
    const payload = {
      interestId: this.data.selectedInterestId,
      happenedOn: this.data.happenedOn,
      happenedAt: buildLocalDateTime(
        this.data.happenedOn || todayString(),
        this.data.happenedTime || currentTimeString()
      ),
      participationOutcome: this.data.selectedOutcome,
      notes: this.data.notes.trim()
    };
    if (this.data.selectedOutcome === "completed") {
      payload.durationMinutes = Math.max(Number(this.data.durationMinutes) || 0, 0);
    }
    this.setData({ isSubmitting: true });
    const childQuery = this.data.selectedChildId ? `?childId=${encodeURIComponent(this.data.selectedChildId)}` : "";
    void (0, import_api.postJson)(`/api/interest-participation-records${childQuery}`, payload).then(() => {
      wx.showToast({ title: "已记录", icon: "success" });
      this.setData({
        selectedOutcome: "completed",
        happenedOn: todayString(),
        happenedTime: currentTimeString(),
        durationMinutes: "30",
        notes: ""
      });
      this.loadSnapshot();
    }).catch((error) => {
      wx.showToast({ title: error.error || "记录未成功", icon: "none" });
    }).finally(() => {
      this.setData({ isSubmitting: false });
    });
  }
});
