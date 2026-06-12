/* global Page, wx */
const { getActiveChildId, getJson, postJson } = require("../../services/api");

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
    durationMinutes: "30",
    notes: ""
  },
  onShow() {
    this.loadChildren().then(() => this.loadSnapshot());
  },
  loadChildren() {
    return getJson("/api/children")
      .then((response) => {
        const rawChildren = response.children || [];
        const selectedChildId =
          this.data.selectedChildId ||
          getActiveChildId() ||
          (rawChildren[0] && rawChildren[0].id) ||
          "";
        const selectedChild =
          rawChildren.find((child) => child.id === selectedChildId) ||
          rawChildren[0];

        this.setData({
          children: rawChildren.map((child) => ({
            ...child,
            selected: child.id === selectedChildId
          })),
          selectedChildId,
          selectedChildName: selectedChild ? selectedChild.nickname : ""
        });
      })
      .catch(() => undefined);
  },
  loadSnapshot() {
    this.setData({ isLoading: true, errorMessage: "" });
    const childQuery = this.data.selectedChildId
      ? `?childId=${encodeURIComponent(this.data.selectedChildId)}`
      : "";

    getJson(`/api/interest-participation-records${childQuery}`)
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
            error.statusCode === 409 ? "请先完成首次配置" : error.error || "兴趣参与记录暂时无法同步"
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
      selectedChildName: selectedChild ? selectedChild.nickname : "",
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
    const childQuery = this.data.selectedChildId
      ? `?childId=${encodeURIComponent(this.data.selectedChildId)}`
      : "";

    postJson(`/api/interest-participation-records${childQuery}`, payload)
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
        wx.showToast({ title: error.error || "记录未成功", icon: "none" });
      })
      .finally(() => {
        this.setData({ isSubmitting: false });
      });
  }
});
