import { Card } from "@/components/ui/card";

const records = [
  {
    id: "swim-25m",
    date: "2026-06-08",
    text: "第一次游过25米。"
  },
  {
    id: "piano-20m",
    date: "2026-06-15",
    text: "第一次主动练琴20分钟。"
  }
];

export function GrowthTimeline() {
  return (
    <section>
      <h2 className="text-lg font-semibold">成长时间轴</h2>
      <div className="mt-3 grid gap-3">
        {records.map((record) => (
          <Card className="p-4" key={record.id}>
            <p className="text-sm text-muted-foreground">{record.date}</p>
            <h3 className="mt-2 font-medium">{record.text}</h3>
          </Card>
        ))}
      </div>
    </section>
  );
}
