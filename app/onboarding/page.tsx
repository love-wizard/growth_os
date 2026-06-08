export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-5 py-8">
      <section>
        <p className="text-sm text-muted-foreground">首次使用</p>
        <h1 className="mt-2 text-3xl font-semibold">先得到今晚能做的一件事</h1>
      </section>
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-medium">今日陪伴建议</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          输入昵称、生日、关注方向、当前挑战和孩子特质后生成建议。
        </p>
      </section>
    </main>
  );
}
