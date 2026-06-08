import { Card } from "@/components/ui/card";

export function SupportiveProgress({
  rate,
  label,
  description
}: {
  rate: number;
  label: string;
  description: string;
}) {
  const percent = Math.round(rate * 100);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">本周完成率</p>
          <h2 className="mt-1 text-xl font-semibold">{label}</h2>
        </div>
        <span className="text-2xl font-semibold text-primary">{percent}%</span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}
