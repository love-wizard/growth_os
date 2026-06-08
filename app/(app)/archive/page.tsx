export default function ArchivePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-8">
      <section>
        <p className="text-sm text-muted-foreground">成长档案</p>
        <h1 className="mt-2 text-3xl font-semibold">成长时间轴</h1>
      </section>
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-medium">成长记录</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          记录孩子真实发生的成长瞬间，图片和视频仅用于展示。
        </p>
      </section>
    </main>
  );
}
