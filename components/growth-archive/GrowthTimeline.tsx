"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

type TimelineRecord = {
  id: string;
  happened_on: string;
  text: string;
  tags?: string[] | null;
  draft_status?: string | null;
  growth_record_media?: Array<unknown>;
};

export function GrowthTimeline({
  records,
  highlightedRecordId
}: {
  records: TimelineRecord[];
  highlightedRecordId?: string | null;
}) {
  const router = useRouter();
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [menuRecordId, setMenuRecordId] = useState<string | null>(null);

  function openRecord(recordId: string) {
    setMenuRecordId(null);
    router.push(`/archive?recordId=${recordId}`);
  }

  async function deleteRecord(recordId: string) {
    if (!window.confirm("删除后可在恢复窗口内撤回，确认删除这条记录吗？")) {
      return;
    }

    setDeletingRecordId(recordId);
    setMenuRecordId(null);
    const response = await fetch(`/api/growth-records/${recordId}`, {
      method: "DELETE"
    });
    setDeletingRecordId(null);

    if (!response.ok) {
      return;
    }

    if (highlightedRecordId === recordId) {
      router.push("/archive");
      return;
    }

    router.refresh();
  }

  return (
    <section>
      <h2 className="text-lg font-semibold">成长时间轴</h2>
      <div className="mt-3 grid gap-3">
        {!records.length ? (
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">还没有成长记录，先从第一条小瞬间开始。</p>
          </Card>
        ) : null}
        {records.map((record) => (
          <Card
            className={`p-4 ${record.id === highlightedRecordId ? "border-primary" : ""}`}
            key={record.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-muted-foreground">{record.happened_on}</p>
                {record.tags?.[0] ? (
                  <span className="rounded-full bg-accent px-2 py-1 text-xs text-muted-foreground">
                    {record.tags[0]}
                  </span>
                ) : null}
                {record.draft_status === "draft" ? (
                  <span className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                    草稿
                  </span>
                ) : null}
                {record.growth_record_media?.length ? (
                  <span className="text-xs text-muted-foreground">
                    {record.growth_record_media.length} 个媒体文件
                  </span>
                ) : null}
              </div>
              <div className="relative">
                <button
                  aria-label="更多操作"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition hover:border-border hover:bg-accent/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={deletingRecordId === record.id}
                  onClick={() =>
                    setMenuRecordId((current) => (current === record.id ? null : record.id))
                  }
                  title="更多操作"
                  type="button"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </button>
                {menuRecordId === record.id ? (
                  <div className="absolute right-0 top-11 z-10 min-w-32 rounded-xl border border-border bg-card p-1 shadow-lg">
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
                      onClick={() => openRecord(record.id)}
                      type="button"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      编辑
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-500 hover:bg-rose-50"
                      onClick={() => deleteRecord(record.id)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      删除
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <h3 className="mt-2 font-medium">{record.text}</h3>
          </Card>
        ))}
      </div>
    </section>
  );
}
