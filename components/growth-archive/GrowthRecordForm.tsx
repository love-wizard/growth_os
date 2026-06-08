import { ImagePlus, Save } from "lucide-react";

export function GrowthRecordForm() {
  return (
    <form className="grid gap-3 rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">新增成长记录</h2>
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">发生日期</span>
        <input
          className="rounded-md border border-input bg-background px-3 py-2"
          defaultValue="2026-06-08"
          type="date"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">成长瞬间</span>
        <textarea
          className="min-h-28 rounded-md border border-input bg-background px-3 py-2"
          defaultValue="第一次游过25米。"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm"
          type="button"
        >
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          添加图片或视频
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          type="button"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          保存成长记录
        </button>
      </div>
    </form>
  );
}
