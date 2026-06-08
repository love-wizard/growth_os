import { calculateWeeklyCompletionRate, type WeeklyCompletionTask } from "./weekly-completion";

export function getSupportiveProgressCopy(tasks: WeeklyCompletionTask[]) {
  const rate = calculateWeeklyCompletionRate(tasks);

  if (rate === 0) {
    return {
      rate,
      label: "本周刚开始",
      description: "先选择一件最容易开始的小事。"
    };
  }

  if (rate < 0.4) {
    return {
      rate,
      label: "正在建立节奏",
      description: "完成多少不是重点，先保留一个轻松的陪伴时刻。"
    };
  }

  if (rate < 0.8) {
    return {
      rate,
      label: "节奏不错",
      description: "本周已经有稳定行动，可以继续保持轻量陪伴。"
    };
  }

  return {
    rate,
    label: "陪伴很稳定",
    description: "可以把一个真实成长瞬间记录下来。"
  };
}
