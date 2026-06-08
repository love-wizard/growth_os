"use client";

import { FormEvent, useState } from "react";
import { Button, Input, Label } from "@/components/ui/form";

export function InviteSecondParentForm() {
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("邀请中");

    const response = await fetch("/api/family/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        role: String(form.get("role") ?? "mother")
      })
    });
    const payload = await response.json().catch(() => ({}));

    setStatus(response.ok ? `邀请已创建：${payload.inviteId}` : "暂时无法创建邀请");
  }

  return (
    <form className="grid gap-4 rounded-lg border border-border bg-card p-5" onSubmit={submit}>
      <div>
        <h2 className="text-lg font-semibold">邀请另一位家长</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          受邀家长会加入同一个家庭空间。
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="invite-email">邮箱</Label>
        <Input id="invite-email" name="email" placeholder="parent@example.com" required type="email" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="invite-role">角色</Label>
        <select
          className="h-11 rounded-md border border-border bg-card px-3 text-sm"
          id="invite-role"
          name="role"
        >
          <option value="mother">妈妈</option>
          <option value="father">爸爸</option>
        </select>
      </div>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      <Button type="submit">创建邀请</Button>
    </form>
  );
}
