"use client";

const questions = [
  "孩子不想练琴怎么办？",
  "如何培养阅读习惯？",
  "英语启蒙如何进行？",
  "最近成长情况如何？",
  "本周末适合做什么活动？"
];

export function QuickQuestions({ onSelect }: { onSelect?: (question: string) => void }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">快捷问题</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {questions.map((question) => (
          <button
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-card-foreground hover:bg-muted"
            key={question}
            onClick={() => onSelect?.(question)}
            type="button"
          >
            {question}
          </button>
        ))}
      </div>
    </section>
  );
}
