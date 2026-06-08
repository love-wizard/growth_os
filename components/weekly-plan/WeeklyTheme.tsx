import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";

export function WeeklyTheme({
  theme,
  weekStart,
  weekEnd
}: {
  theme: string;
  weekStart: string;
  weekEnd: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <CalendarDays className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm text-muted-foreground">本周主题</p>
          <h2 className="mt-2 text-2xl font-semibold">《{theme}》</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {weekStart} 至 {weekEnd}
          </p>
        </div>
      </div>
    </Card>
  );
}
