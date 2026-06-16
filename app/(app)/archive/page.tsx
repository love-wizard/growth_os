import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { GrowthRecordDraftEditor } from "@/components/growth-archive/GrowthRecordDraftEditor";
import { GrowthRecordForm } from "@/components/growth-archive/GrowthRecordForm";
import { GrowthTimeline } from "@/components/growth-archive/GrowthTimeline";
import { MonthView } from "@/components/growth-archive/MonthView";
import { YearView } from "@/components/growth-archive/YearView";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { getGrowthRecordForFamily } from "@/lib/repositories/growth-record-repo";
import { listGrowthRecordsForFamily } from "@/lib/services/growth-record-service";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

type ArchiveDraftRecord = {
  id: string;
  happened_on: string;
  text: string;
  tags?: string[] | null;
  parent_notes?: string | null;
  draft_status?: string | null;
};

export default async function ArchivePage({
  searchParams
}: {
  searchParams: Promise<{ draftId?: string; recordId?: string }>;
}) {
  const { draftId, recordId } = await searchParams;
  const selectedRecordId = recordId ?? draftId;
  const supabase = await createServerSupabaseClient();
  const storageSupabase = createServiceRoleSupabaseClient();

  let draft: ArchiveDraftRecord | null = null;
  let records: Awaited<ReturnType<typeof listGrowthRecordsForFamily>>["records"] = [];

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (membership) {
      const page = await listGrowthRecordsForFamily(supabase, storageSupabase, {
        familyId: membership.family_id,
        scope: "family",
        limit: 20,
        offset: 0
      });
      records = page.records;

      if (selectedRecordId) {
        const selectedDraft = await getGrowthRecordForFamily(supabase, {
          familyId: membership.family_id,
          recordId: selectedRecordId
        });
        if (selectedDraft) {
          draft = {
            id: String(selectedDraft.id),
            happened_on: selectedDraft.happened_on,
            text: selectedDraft.text,
            tags: selectedDraft.tags,
            parent_notes: selectedDraft.parent_notes,
            draft_status: selectedDraft.draft_status
          };
        }
      }

      if (!draft) {
        const latestDraft = records.find((record) => record.draft_status === "draft");
        draft = latestDraft
          ? {
              id: String(latestDraft.id),
              happened_on: latestDraft.happened_on,
              text: latestDraft.text,
              tags: latestDraft.tags,
              parent_notes: latestDraft.parent_notes,
              draft_status: latestDraft.draft_status
            }
          : null;
      }
    }
  } catch {
    draft = null;
    records = [];
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-8">
      <section>
        <p className="text-sm text-muted-foreground">成长档案</p>
        <h1 className="mt-2 text-3xl font-semibold">成长时间轴</h1>
      </section>
      <GrowthRecordForm />
      <GrowthRecordDraftEditor
        key={`${draft?.id ?? "empty"}:${draft?.draft_status ?? "none"}:${draft?.happened_on ?? ""}`}
        draft={draft}
      />
      <GrowthTimeline highlightedRecordId={draft?.id ?? selectedRecordId ?? null} records={records} />
      <div className="grid gap-4 lg:grid-cols-2">
        <MonthView />
        <YearView />
      </div>
    </main>
  );
}
