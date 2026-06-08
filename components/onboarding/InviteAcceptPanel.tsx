"use client";

import { FormEvent, useState } from "react";
import { Button, Input, Label } from "@/components/ui/form";

export function InviteAcceptPanel({ initialInviteId = "" }: { initialInviteId?: string }) {
  const [inviteId, setInviteId] = useState(initialInviteId);
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("加入中");

    const response = await fetch(`/api/family/invite/${inviteId}/accept`, {
      method: "POST"
    });

    setStatus(response.ok ? "已加入家庭空间" : "暂时无法接受邀请");
  }

  return (
    <form className="mt-4 grid gap-3" onSubmit={submit}>
      <div className="grid gap-2">
        <Label htmlFor="inviteId">邀请 ID</Label>
        <Input
          id="inviteId"
          onChange={(event) => setInviteId(event.target.value)}
          required
          value={inviteId}
        />
      </div>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      <Button type="submit">接受邀请</Button>
    </form>
  );
}
