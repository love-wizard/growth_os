export default function WeeklyPlanPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-8">
      <section>
        <p className="text-sm text-muted-foreground">本周任务</p>
        <h1 className="mt-2 text-3xl font-semibold">周计划</h1>
      </section>
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-medium">本周主题</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          周计划会在完成孩子档案和年度目标后生成。
        </p>
      </section>
    </main>
  );
}
