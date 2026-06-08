import { Card } from "@/components/ui/card";

export function WeeklyThemePanel({ theme }: { theme: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">本周主题</p>
      <h2 className="mt-1 text-xl font-semibold">{theme}</h2>
    </Card>
  );
}
