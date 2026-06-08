export interface WeeklyCompletionTask {
  plannedCount: number;
  completedCount: number;
}

export function calculateWeeklyCompletionRate(tasks: WeeklyCompletionTask[]) {
  const totalPlanned = tasks.reduce((sum, task) => sum + task.plannedCount, 0);

  if (totalPlanned === 0) {
    return 0;
  }

  const totalCompleted = tasks.reduce((sum, task) => {
    return sum + Math.min(task.completedCount, task.plannedCount);
  }, 0);

  return totalCompleted / totalPlanned;
}
