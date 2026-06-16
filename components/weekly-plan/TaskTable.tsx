"use client";

import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Card } from "@/components/ui/card";

export interface WeeklyPlanTaskView {
  id: string;
  assignee_type: string;
  title: string;
  planned_count: number;
  completed_count: number;
  status: string;
}

export function TaskTable({
  title,
  tasks
}: {
  title: string;
  tasks: WeeklyPlanTaskView[];
}) {
  const [rows, setRows] = useState(tasks);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">任务</th>
              <th className="px-4 py-3 font-medium">次数</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 text-right font-medium">调整</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((task) => (
              <tr className="border-t border-border" key={task.id}>
                <td className="px-4 py-3 font-medium">{task.title}</td>
                <td className="px-4 py-3">{task.planned_count}次</td>
                <td className="px-4 py-3 text-muted-foreground">
                  已完成{task.completed_count}次
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <ProgressButton
                      label={`减少${task.title}完成次数`}
                      onClick={() => updateProgress(task.id, task.completed_count - 1)}
                      disabled={task.completed_count === 0}
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </ProgressButton>
                    <ProgressButton
                      label={`增加${task.title}完成次数`}
                      onClick={() => updateProgress(task.id, task.completed_count + 1)}
                      disabled={task.completed_count >= task.planned_count}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </ProgressButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  async function updateProgress(taskId: string, completedCount: number) {
    setRows((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed_count: completedCount,
              status:
                completedCount >= task.planned_count
                  ? "completed"
                  : completedCount > 0
                    ? "in_progress"
                    : "not_started"
            }
          : task
      )
    );

    await fetch(`/api/weekly-plan/tasks/${taskId}/progress`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        completedCount,
        entrySurface: "weekly_plan"
      })
    }).catch(() => undefined);
  }
}

function ProgressButton({
  children,
  disabled,
  label,
  onClick
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      type="button"
      title={label}
    >
      {children}
    </button>
  );
}
