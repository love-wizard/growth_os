import { Card } from "@/components/ui/card";

const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export function YearView() {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">年视图</p>
      <h2 className="mt-1 text-lg font-semibold">2026 成长记录</h2>
      <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-6">
        {months.map((month) => (
          <span
            className={`rounded-md border border-border px-3 py-2 text-center text-sm ${
              month === "6月" ? "bg-primary text-primary-foreground" : "bg-background"
            }`}
            key={month}
          >
            {month}
          </span>
        ))}
      </div>
    </Card>
  );
}
