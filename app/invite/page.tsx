import { InviteAcceptPanel } from "@/components/onboarding/InviteAcceptPanel";

export default async function InvitePage({
  searchParams
}: {
  searchParams: Promise<{ inviteId?: string }>;
}) {
  const { inviteId } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-5 py-8">
      <section>
        <p className="text-sm text-muted-foreground">家庭邀请</p>
        <h1 className="mt-2 text-3xl font-semibold">加入同一个家庭空间</h1>
      </section>
      <section className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          受邀家长会加入已有家庭，不会创建重复的孩子档案。
        </p>
        <InviteAcceptPanel initialInviteId={inviteId ?? ""} />
      </section>
    </main>
  );
}
