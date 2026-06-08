import { Card } from "@/components/ui/card";

export function TodayTasks({
  tasks
}: {
  tasks: Array<{
    id: string;
    assignee_type: string;
    title: string;
    planned_count: number;
    completed_count: number;
  }>;
}) {
  return (
    <section className="grid gap-3">
      {tasks.map((task) => (
        <Card className="p-4" key={task.id}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{assigneeLabel(task.assignee_type)}</p>
              <h2 className="mt-1 font-medium">{task.title}</h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {task.completed_count}/{task.planned_count}
            </span>
          </div>
        </Card>
      ))}
    </section>
  );
}

function assigneeLabel(assigneeType: string) {
  const labels: Record<string, string> = {
    father: "爸爸任务",
    mother: "妈妈任务",
    child: "孩子任务",
    family: "家庭任务"
  };

  return labels[assigneeType] ?? assigneeType;
}
