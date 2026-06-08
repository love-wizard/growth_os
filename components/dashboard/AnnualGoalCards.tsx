import { Card } from "@/components/ui/card";

export function AnnualGoalCards({
  goals
}: {
  goals: Array<{ id: string; title: string; status: string }>;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {goals.map((goal) => (
        <Card className="p-4" key={goal.id}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium">{goal.title}</h2>
            <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
              {goal.status === "active" ? "进行中" : goal.status}
            </span>
          </div>
        </Card>
      ))}
    </section>
  );
}
