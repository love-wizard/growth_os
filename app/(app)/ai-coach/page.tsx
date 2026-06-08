export default function AICoachPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-8">
      <section>
        <p className="text-sm text-muted-foreground">AI 教练</p>
        <h1 className="mt-2 text-3xl font-semibold">AI 成长教练</h1>
      </section>
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-medium">快捷问题</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          AI 回答会基于孩子档案、目标、周计划和成长记录。
        </p>
      </section>
    </main>
  );
}
