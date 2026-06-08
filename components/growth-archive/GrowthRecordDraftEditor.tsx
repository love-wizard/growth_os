import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";

export function GrowthRecordDraftEditor() {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Pencil className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">草稿</p>
          <h2 className="mt-1 font-semibold">完成了一项本周成长任务</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            草稿可以来自周计划、AI 建议或父母的一句话，保存前可继续编辑。
          </p>
          <button
            className="mt-4 rounded-md border border-border bg-background px-3 py-2 text-sm"
            type="button"
          >
            编辑草稿
          </button>
        </div>
      </div>
    </Card>
  );
}
