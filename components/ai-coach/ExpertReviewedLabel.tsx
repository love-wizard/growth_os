import { ShieldCheck } from "lucide-react";

export function ExpertReviewedLabel({ reviewed = false }: { reviewed?: boolean }) {
  if (!reviewed) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      专家抽检通过
    </span>
  );
}
