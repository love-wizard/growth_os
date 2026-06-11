import { getJson, postJson } from "../../services/api";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

const outcomeOptions = [
  { value: "completed", label: "已完成" },
  { value: "missed", label: "缺席" },
  { value: "cancelled", label: "取消" },
  { value: "rescheduled", label: "改期" }
] as const;

const outcomeLabels = outcomeOptions.reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

function formatRecord(record: {
  id: string;
  happened_on: string;
  participation_outcome: string;
  duration_minutes?: number | null;
  count?: number | null;
  notes?: string | null;
  child_interests?: { name: string } | null;
}) {
  const duration = record.duration_minutes ? `${record.duration_minutes}分钟` : "";
  const count = record.count ? `${record.count}次` : "";

  return {
    id: record.id,
    date: record.happened_on,
    interestName: record.child_interests?.name || "兴趣活动",
    outcomeLabel: outcomeLabels[record.participation_outcome] || "已记录",
    outcome: record.participation_outcome,
    detail: record.notes || "",
    badge: duration || count,
    durationMinutes: record.duration_minutes || 0
  };
}

function buildSummary(records: ReturnType<typeof formatRecord>[]) {
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
    interestOptions: [] as Array<{ id: string; name: string }>,
    records: [] as Array<{
      id: string;
      date: string;
      interestName: string;
      outcomeLabel: string;
      outcome: string;
      detail: string;
      badge: string;
      durationMinutes: number;
    }>,
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
    void getJson<{
      interests: Array<{ id: string; name: string }>;
      records: Array<{
        id: string;
        happened_on: string;
        participation_outcome: string;
        duration_minutes?: number | null;
        count?: number | null;
        notes?: string | null;
        child_interests?: { name: string } | null;
      }>;
    }>("/api/interest-participation-records")
      .then((response) => {
        const interestOptions = response.interests || [];
        const records = (response.records || []).map(formatRecord);
        this.setData({
          isLoading: false,
          interestOptions,
          selectedInterestId: this.data.selectedInterestId || interestOptions[0]?.id || "",
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
  chooseInterest(event: { currentTarget: { dataset: { id: string } } }) {
    this.setData({ selectedInterestId: event.currentTarget.dataset.id });
  },
  onDateInput(event: { detail: { value: string } }) {
    this.setData({ happenedOn: event.detail.value });
  },
  chooseOutcome(event: { currentTarget: { dataset: { value: string } } }) {
    const selectedOutcome = event.currentTarget.dataset.value;
    this.setData({
      selectedOutcome,
      durationMinutes: selectedOutcome === "completed" ? this.data.durationMinutes || "30" : ""
    });
  },
  onDurationInput(event: { detail: { value: string } }) {
    this.setData({ durationMinutes: event.detail.value });
  },
  onNotesInput(event: { detail: { value: string } }) {
    this.setData({ notes: event.detail.value });
  },
  saveRecord() {
    if (!this.data.selectedInterestId) {
      wx.showToast({ title: "先选择一个兴趣", icon: "none" });
      return;
    }

    const payload: {
      interestId: string;
      happenedOn: string;
      participationOutcome: string;
      notes: string;
      durationMinutes?: number;
    } = {
      interestId: this.data.selectedInterestId,
      happenedOn: this.data.happenedOn,
      participationOutcome: this.data.selectedOutcome,
      notes: this.data.notes.trim()
    };

    if (this.data.selectedOutcome === "completed") {
      payload.durationMinutes = Math.max(Number(this.data.durationMinutes) || 0, 0);
    }

    this.setData({ isSubmitting: true });
    void postJson("/api/interest-participation-records", payload)
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
