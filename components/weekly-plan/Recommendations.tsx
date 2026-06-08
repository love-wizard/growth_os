import { BookOpen, Languages } from "lucide-react";
import { Card } from "@/components/ui/card";

export function Recommendations({
  reading,
  english
}: {
  reading: string;
  english: string;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Card className="p-5">
        <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="mt-3 font-semibold">阅读推荐</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{reading}</p>
      </Card>
      <Card className="p-5">
        <Languages className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="mt-3 font-semibold">英语推荐</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{english}</p>
      </Card>
    </section>
  );
}
