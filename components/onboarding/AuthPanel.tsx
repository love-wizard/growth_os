"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label } from "@/components/ui/form";

export function AuthPanel() {
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const supabase = createClient();

    const result =
      mode === "sign_in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setPending(false);

    if (result.error) {
      setStatus(result.error.message);
      return;
    }

    if (mode === "sign_up" && !result.data.session) {
      setStatus("注册成功，请先完成邮箱确认后再登录。");
      return;
    }

    setStatus("已登录，可以继续生成成长系统。");
    window.location.reload();
  }

  return (
    <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold">家长账号</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          先登录家长账号，再创建孩子档案和成长系统。
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
        <button
          className={`rounded px-3 py-2 text-sm ${mode === "sign_in" ? "bg-card shadow-sm" : ""}`}
          onClick={() => setMode("sign_in")}
          type="button"
        >
          登录
        </button>
        <button
          className={`rounded px-3 py-2 text-sm ${mode === "sign_up" ? "bg-card shadow-sm" : ""}`}
          onClick={() => setMode("sign_up")}
          type="button"
        >
          注册
        </button>
      </div>
      <form className="grid gap-3" onSubmit={submit}>
        <div className="grid gap-2">
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" name="email" placeholder="parent@familylove.space" required type="email" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">密码</Label>
          <Input id="password" minLength={6} name="password" required type="password" />
        </div>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        <Button disabled={pending} type="submit">
          {pending ? "处理中" : mode === "sign_in" ? "登录" : "注册"}
        </Button>
      </form>
    </section>
  );
}
