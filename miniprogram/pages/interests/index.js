/* global Page, wx */
const { getJson, postJson } = require("../../services/api");

function todayString() {
  return new Date().toISOString().slice(0, 10);
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
  const duration = record.duration_minutes ? `${record.duration_minutes}分钟` : "";
  const count = record.count ? `${record.count}次` : "";
  const badge = duration || count;

  return {
    id: record.id,
    date: record.happened_on,
    interestName: record.child_interests && record.child_interests.name
      ? record.child_interests.name
      : "兴趣活动",
    outcomeLabel: outcomeLabels[record.participation_outcome] || "已记录",
    outcome: record.participation_outcome,
    detail: record.notes || "",
    badge,
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
    latestLabel: records[0] ? `${records[0].date} · ${records[0].interestName}` : "还没有记录"
  };
}

Page({
  data: {
    isLoading: false,
    isSubmitting: false,
    errorMessage: "",
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
    durationMinutes: "30",
    notes: ""
  },
  onShow() {
    this.loadSnapshot();
  },
  loadSnapshot() {
    this.setData({ isLoading: true, errorMessage: "" });
    getJson("/api/interest-participation-records")
      .then((response) => {
        const interestOptions = response.interests || [];
        const records = (response.records || []).map(formatRecord);
        this.setData({
          isLoading: false,
          interestOptions,
          selectedInterestId: this.data.selectedInterestId || (interestOptions[0] && interestOptions[0].id) || "",
          records,
          summary: buildSummary(records)
        });
      })
      .catch((error) => {
        this.setData({
          isLoading: false,
          errorMessage:
            error.statusCode === 409 ? "请先完成首次配置" : error.error || "兴趣班记录加载失败"
        });
      });
  },
  chooseInterest(event) {
    this.setData({ selectedInterestId: event.currentTarget.dataset.id });
  },
  onDateInput(event) {
    this.setData({ happenedOn: event.detail.value });
  },
  chooseOutcome(event) {
    const selectedOutcome = event.currentTarget.dataset.value;
    this.setData({
      selectedOutcome,
      durationMinutes: selectedOutcome === "completed" ? (this.data.durationMinutes || "30") : ""
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
      participationOutcome: this.data.selectedOutcome,
      notes: this.data.notes.trim()
    };

    if (this.data.selectedOutcome === "completed") {
      payload.durationMinutes = Math.max(Number(this.data.durationMinutes) || 0, 0);
    }

    this.setData({ isSubmitting: true });
    postJson("/api/interest-participation-records", payload)
      .then(() => {
        wx.showToast({ title: "已记录", icon: "success" });
        this.setData({
          selectedOutcome: "completed",
          durationMinutes: "30",
          notes: ""
        });
        this.loadSnapshot();
      })
      .catch((error) => {
        wx.showToast({ title: error.error || "记录失败", icon: "none" });
      })
      .finally(() => {
        this.setData({ isSubmitting: false });
      });
  }
});
