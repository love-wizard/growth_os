"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui/form";
import { Card } from "@/components/ui/card";

type DraftRecord = {
  id: string;
  happened_on: string;
  text: string;
  tags?: string[] | null;
  parent_notes?: string | null;
  draft_status?: string | null;
};

function formatTagInput(tags?: string[] | null) {
  return (tags || []).join(", ");
}

function parseTagInput(value: string) {
  return value
    .split(/[，,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function GrowthRecordDraftEditor({
  draft
}: {
  draft?: DraftRecord | null;
}) {
  const router = useRouter();
  const [happenedOn, setHappenedOn] = useState(draft?.happened_on || "");
  const [text, setText] = useState(draft?.text || "");
  const [tags, setTags] = useState(formatTagInput(draft?.tags));
  const [parentNotes, setParentNotes] = useState(draft?.parent_notes || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!draft) {
    return (
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <Pencil className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">成长记录</p>
            <h2 className="mt-1 font-semibold">还没有可查看的记录详情</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              从时间轴里点开一条记录，或先记录今天发生的小瞬间。
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const activeDraft = draft;
  const isDraft = activeDraft.draft_status === "draft";

  async function saveDraft() {
    setIsSaving(true);
    setMessage(null);

    const response = await fetch(`/api/growth-records/${activeDraft.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        happenedOn,
        text,
        tags: parseTagInput(tags),
        parentNotes: parentNotes.trim() || undefined,
        draftStatus: "saved"
      })
    });
    const payload = await response.json().catch(() => ({}));
    setIsSaving(false);

    if (!response.ok) {
      setMessage((payload as { error?: string }).error || "保存成长记录未成功");
      return;
    }

    setMessage("成长记录已保存");
    setIsEditing(false);
    router.refresh();
  }

  function cancelEditing() {
    setHappenedOn(activeDraft.happened_on);
    setText(activeDraft.text);
    setTags(formatTagInput(activeDraft.tags));
    setParentNotes(activeDraft.parent_notes || "");
    setIsEditing(false);
    setMessage(null);
  }

  async function deleteDraft() {
    if (!window.confirm("确认删除这条记录吗？")) {
      return;
    }

    setIsDeleting(true);
    setIsActionsOpen(false);
    setMessage(null);
    const response = await fetch(`/api/growth-records/${activeDraft.id}`, {
      method: "DELETE"
    });
    const payload = await response.json().catch(() => ({}));
    setIsDeleting(false);

    if (!response.ok) {
      setMessage((payload as { error?: string }).error || "删除成长记录未成功");
      return;
    }

    router.push("/archive");
    router.refresh();
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Pencil className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{isDraft ? "草稿" : "成长记录"}</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{isDraft ? "待完善的成长草稿" : "记录详情"}</h2>
              <span className="rounded-full bg-accent px-2 py-1 text-xs text-muted-foreground">
                {isDraft ? "待完善" : "已保存"}
              </span>
            </div>
            {isEditing ? (
              <button
                aria-label="删除这条记录"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isDeleting}
                onClick={deleteDraft}
                title="删除这条记录"
                type="button"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <div className="relative">
                <button
                  aria-label="更多操作"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition hover:border-border hover:bg-accent/60 hover:text-foreground"
                  onClick={() => setIsActionsOpen((current) => !current)}
                  title="更多操作"
                  type="button"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </button>
                {isActionsOpen ? (
                  <div className="absolute right-0 top-11 z-10 min-w-32 rounded-xl border border-border bg-card p-1 shadow-lg">
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
                      onClick={() => {
                        setIsActionsOpen(false);
                        setIsEditing(true);
                      }}
                      type="button"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      编辑
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-500 hover:bg-rose-50"
                      disabled={isDeleting}
                      onClick={deleteDraft}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      删除
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-4 grid gap-4">
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">发生日期</span>
                <Input type="date" value={happenedOn} onChange={(event) => setHappenedOn(event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">成长瞬间</span>
                <Textarea value={text} onChange={(event) => setText(event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">标签</span>
                <Input
                  placeholder="成长瞬间, 阅读表达"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">父母备注</span>
                <Textarea
                  placeholder="补一句当时的真实观察"
                  value={parentNotes}
                  onChange={(event) => setParentNotes(event.target.value)}
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled={isSaving || !happenedOn || !text.trim()} onClick={saveDraft} type="button">
                  {isSaving ? "保存中" : "保存成长记录"}
                </Button>
                <button
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  onClick={cancelEditing}
                  type="button"
                >
                  取消
                </button>
                {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              <div>
                <p className="text-sm text-muted-foreground">发生日期</p>
                <p className="mt-1 text-sm font-medium text-foreground">{activeDraft.happened_on}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">成长瞬间</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">{activeDraft.text}</p>
              </div>
              {activeDraft.tags?.length ? (
                <div>
                  <p className="text-sm text-muted-foreground">标签</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeDraft.tags.map((tag) => (
                      <span className="rounded-full bg-accent px-2 py-1 text-xs text-muted-foreground" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {activeDraft.parent_notes ? (
                <div>
                  <p className="text-sm text-muted-foreground">父母备注</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {activeDraft.parent_notes}
                  </p>
                </div>
              ) : null}
              <p className="text-sm text-muted-foreground">
                需要修正时，再从右上角进入编辑。
              </p>
              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
