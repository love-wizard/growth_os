import { Card } from "@/components/ui/card";

const records = [
  {
    id: "piano-2026-06-08",
    title: "钢琴",
    happenedOn: "2026-06-08",
    outcome: "已完成",
    detail: "20分钟，第一次主动练习"
  },
  {
    id: "swimming-2026-06-06",
    title: "游泳",
    happenedOn: "2026-06-06",
    outcome: "已完成",
    detail: "完成一次水中适应"
  }
];

export function InterestParticipationHistory() {
  return (
    <section>
      <h2 className="text-lg font-semibold">近期课程记录</h2>
      <div className="mt-3 grid gap-3">
        {records.map((record) => (
          <Card className="p-4" key={record.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{record.happenedOn}</p>
                <h3 className="mt-1 font-medium">{record.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{record.detail}</p>
              </div>
              <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                {record.outcome}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
