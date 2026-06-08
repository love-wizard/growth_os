export default function ProfilePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-8">
      <section>
        <p className="text-sm text-muted-foreground">我的</p>
        <h1 className="mt-2 text-3xl font-semibold">家庭设置</h1>
      </section>
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-medium">孩子档案与提醒</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          管理孩子信息、兴趣参与记录和温和提醒偏好。
        </p>
      </section>
    </main>
  );
}
