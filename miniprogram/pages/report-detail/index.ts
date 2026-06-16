import { getJson } from "../../services/api";

type GrowthReport = {
  id: string;
  title: string;
  summary: string;
  scope: "child" | "family";
  report_type: "monthly" | "annual";
  period_start: string;
  period_end: string;
  source_record_count: number;
  source_course_record_count: number;
  sections: Array<{
    area: string;
    summary: string;
    evidence?: string[];
  }>;
};

function reportTypeLabel(reportType?: string) {
  return reportType === "annual" ? "成长年报" : "成长月报";
}

Page({
  data: {
    reportId: "",
    report: null as GrowthReport | null,
    reportTypeLabel: "成长月报",
    periodLabel: "",
    sourceLabel: "",
    isLoading: false,
    errorMessage: ""
  },
  onLoad(query: Record<string, string | undefined>) {
    const reportId = query.reportId || "";
    this.setData({ reportId });
    if (reportId) {
      this.loadReport();
    }
  },
  loadReport() {
    if (!this.data.reportId) {
      this.setData({ errorMessage: "报告不存在" });
      return;
    }

    this.setData({ isLoading: true, errorMessage: "" });
    void getJson<{ report?: GrowthReport }>(`/api/growth-reports/${this.data.reportId}`)
      .then((response) => {
        const report = response.report || null;
        this.setData({
          report,
          reportTypeLabel: reportTypeLabel(report?.report_type),
          periodLabel: report ? `${report.period_start} 至 ${report.period_end}` : "",
          sourceLabel: report
            ? `基于 ${report.source_record_count || 0} 条成长瞬间和 ${report.source_course_record_count || 0} 条课程记录生成`
            : "",
          isLoading: false,
          errorMessage: report ? "" : "报告不存在"
        });
      })
      .catch((error) => {
        this.setData({
          isLoading: false,
          errorMessage: error.error || "报告暂时无法打开"
        });
      });
  },
  goBack() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: "/pages/archive/index" })
    });
  }
});
