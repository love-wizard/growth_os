import { postJson } from "../../services/api";

Page({
  data: {
    scenarioType: "limited_evening_time"
  },
  onLoad(query: Record<string, string | undefined>) {
    const scenarioType = query.scenarioType || "limited_evening_time";
    this.setData({ scenarioType });
    void postJson("/api/wechat/scenario-entry", {
      scenarioType,
      sourceContext: {
        surface: "mini_program"
      }
    });
  }
});
