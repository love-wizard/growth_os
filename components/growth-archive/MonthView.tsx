import { Card } from "@/components/ui/card";

export function MonthView() {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">月视图</p>
      <h2 className="mt-1 text-lg font-semibold">2026 年 6 月</h2>
      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
        {Array.from({ length: 30 }, (_, index) => (
          <span
            className={`rounded-md border border-border py-2 ${
              index === 7 || index === 14 ? "bg-primary text-primary-foreground" : "bg-background"
            }`}
            key={index}
          >
            {index + 1}
          </span>
        ))}
      </div>
    </Card>
  );
}
