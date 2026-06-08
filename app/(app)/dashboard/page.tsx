export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-8">
      <section>
        <p className="text-sm text-muted-foreground">Growth OS</p>
        <h1 className="mt-2 text-3xl font-semibold">今天如何陪伴孩子成长？</h1>
      </section>
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-medium">今日陪伴建议</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          完成首次引导后，这里会显示最适合今天的一件亲子行动。
        </p>
      </section>
    </main>
  );
}
