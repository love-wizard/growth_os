import { Recommendations } from "@/components/weekly-plan/Recommendations";
import { TaskTable, type WeeklyPlanTaskView } from "@/components/weekly-plan/TaskTable";
import { WeekendActivity } from "@/components/weekly-plan/WeekendActivity";
import { WeeklyTheme } from "@/components/weekly-plan/WeeklyTheme";

export default function WeeklyPlanPage() {
  const fatherTasks: WeeklyPlanTaskView[] = [
    {
      id: "father-outdoor",
      assignee_type: "father",
      title: "户外运动",
      planned_count: 3,
      completed_count: 2,
      status: "in_progress"
    },
    {
      id: "father-explore",
      assignee_type: "father",
      title: "周末探索",
      planned_count: 1,
      completed_count: 0,
      status: "not_started"
    }
  ];
  const motherTasks: WeeklyPlanTaskView[] = [
    {
      id: "mother-reading",
      assignee_type: "mother",
      title: "睡前阅读",
      planned_count: 3,
      completed_count: 1,
      status: "in_progress"
    },
    {
      id: "mother-english",
      assignee_type: "mother",
      title: "英文绘本音频",
      planned_count: 3,
      completed_count: 1,
      status: "in_progress"
    }
  ];
  const childTasks: WeeklyPlanTaskView[] = [
    {
      id: "child-expression",
      assignee_type: "child",
      title: "说出今天最开心的一件事",
      planned_count: 3,
      completed_count: 1,
      status: "in_progress"
    }
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-8">
      <section>
        <p className="text-sm text-muted-foreground">本周任务</p>
        <h1 className="mt-2 text-3xl font-semibold">周计划</h1>
      </section>
      <WeeklyTheme
        theme="建立阅读习惯"
        weekStart="2026-06-08"
        weekEnd="2026-06-14"
      />
      <TaskTable title="爸爸任务" tasks={fatherTasks} />
      <TaskTable title="妈妈任务" tasks={motherTasks} />
      <TaskTable title="孩子任务" tasks={childTasks} />
      <Recommendations
        reading="每天10分钟亲子共读，优先选择孩子愿意重复读的书。"
        english="每天5分钟英文儿歌或绘本音频，让输入保持轻松。"
      />
      <WeekendActivity activity="去附近公园做一次树叶和昆虫观察" />
    </main>
  );
}
