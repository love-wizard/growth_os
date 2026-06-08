import Link from "next/link";
import { Bot } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AICoachEntry() {
  return (
    <Link href="/ai-coach">
      <Card className="flex items-center gap-3 p-4 transition hover:border-primary">
        <Bot className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-medium">问 AI 成长教练</h2>
          <p className="text-sm text-muted-foreground">围绕孩子真实情况获得建议</p>
        </div>
      </Card>
    </Link>
  );
}
