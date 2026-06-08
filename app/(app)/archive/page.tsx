import { GrowthRecordDraftEditor } from "@/components/growth-archive/GrowthRecordDraftEditor";
import { GrowthRecordForm } from "@/components/growth-archive/GrowthRecordForm";
import { GrowthTimeline } from "@/components/growth-archive/GrowthTimeline";
import { MonthView } from "@/components/growth-archive/MonthView";
import { YearView } from "@/components/growth-archive/YearView";

export default function ArchivePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-8">
      <section>
        <p className="text-sm text-muted-foreground">成长档案</p>
        <h1 className="mt-2 text-3xl font-semibold">成长时间轴</h1>
      </section>
      <GrowthRecordForm />
      <GrowthRecordDraftEditor />
      <GrowthTimeline />
      <div className="grid gap-4 lg:grid-cols-2">
        <MonthView />
        <YearView />
      </div>
    </main>
  );
}
