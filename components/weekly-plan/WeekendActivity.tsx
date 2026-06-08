import { Compass } from "lucide-react";
import { Card } from "@/components/ui/card";

export function WeekendActivity({ activity }: { activity: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Compass className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm text-muted-foreground">周末活动</p>
          <h2 className="mt-2 text-lg font-semibold">{activity}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            以轻松参与为主，不用追求完成度。
          </p>
        </div>
      </div>
    </Card>
  );
}
