import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TodayGuidancePanel({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-primary/30 bg-accent/60">
      <CardHeader>
        <p className="text-sm text-muted-foreground">今天最重要的一件事</p>
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6">{description}</p>
      </CardContent>
    </Card>
  );
}
