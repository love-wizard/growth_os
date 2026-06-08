import { Card } from "@/components/ui/card";

export interface CoachResponseView {
  title: string;
  summary?: string;
  analysis?: string[];
  actions?: string[];
  followUpQuestion?: string;
}

export function CoachResponse({ response }: { response: CoachResponseView }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">AI 成长教练</p>
      <h2 className="mt-2 text-xl font-semibold">{response.title}</h2>
      {response.summary ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{response.summary}</p>
      ) : null}
      {response.analysis?.length ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold">结合孩子情况</h3>
          <ul className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
            {response.analysis.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {response.actions?.length ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold">今天可以这样做</h3>
          <ul className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
            {response.actions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {response.followUpQuestion ? (
        <p className="mt-4 text-sm font-medium">{response.followUpQuestion}</p>
      ) : null}
    </Card>
  );
}
