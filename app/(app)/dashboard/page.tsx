import { AICoachEntry } from "@/components/dashboard/AICoachEntry";
import { AnnualGoalCards } from "@/components/dashboard/AnnualGoalCards";
import { SupportiveProgress } from "@/components/dashboard/SupportiveProgress";
import { TodayGuidancePanel } from "@/components/dashboard/TodayGuidancePanel";
import { TodayTasks } from "@/components/dashboard/TodayTasks";
import { WeeklyThemePanel } from "@/components/dashboard/WeeklyThemePanel";

export default function DashboardPage() {
  const goals = [
    { id: "health", title: "身心健康", status: "active" },
    { id: "reading", title: "阅读习惯", status: "active" }
  ];
  const tasks = [
    {
      id: "family-walk",
      assignee_type: "family",
      title: "晚饭后一起散步15分钟",
      planned_count: 1,
      completed_count: 0
    }
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-8">
      <section>
        <p className="text-sm text-muted-foreground">Growth OS</p>
        <h1 className="mt-2 text-3xl font-semibold">今天如何陪伴孩子成长？</h1>
      </section>
      <TodayGuidancePanel
        description="先把任务做小，重点是父母和孩子一起完成一个轻松行动。"
        title="晚饭后一起散步15分钟"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <WeeklyThemePanel theme="建立稳定陪伴节奏" />
        <SupportiveProgress
          description="先选择一件最容易开始的小事。"
          label="本周刚开始"
          rate={0}
        />
      </div>
      <AnnualGoalCards goals={goals} />
      <AICoachEntry />
      <TodayTasks tasks={tasks} />
    </main>
  );
}
