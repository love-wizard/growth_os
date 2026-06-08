import { FirstGuidanceFlow } from "@/components/onboarding/FirstGuidanceFlow";

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-5 py-8">
      <section>
        <p className="text-sm text-muted-foreground">首次使用</p>
        <h1 className="mt-2 text-3xl font-semibold">先得到今晚能做的一件事</h1>
      </section>
      <FirstGuidanceFlow />
    </main>
  );
}
