"use client";

import { FormEvent, useState } from "react";
import { Button, Input, Label } from "@/components/ui/form";

export function FullOnboardingForm() {
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("保存中");

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        childProfile: {
          name: String(form.get("name") ?? ""),
          nickname: String(form.get("nickname") ?? ""),
          birthDate: String(form.get("birthDate") ?? ""),
          gender: String(form.get("gender") ?? "")
        },
        interests: String(form.get("interests") ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        annualGoals: String(form.get("annualGoals") ?? "")
          .split(",")
          .map((title) => ({ title: title.trim() }))
          .filter((goal) => goal.title)
      })
    });

    if (response.ok) {
      setStatus("成长系统已生成");
      return;
    }

    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setStatus(data?.error ?? "暂时无法生成成长系统");
  }

  return (
    <form className="grid gap-4 rounded-lg border border-border bg-card p-5" onSubmit={submit}>
      <div>
        <h2 className="text-lg font-semibold">完整孩子档案</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          完成后会生成初始年度规划、月度主题和本周任务。
        </p>
      </div>
      <Field label="姓名" name="name" placeholder="钟小朋友" />
      <Field label="昵称" name="nickname" placeholder="小钟" />
      <Field label="出生日期" name="birthDate" type="date" />
      <Field label="性别" name="gender" placeholder="female / male" />
      <Field label="兴趣，逗号分隔" name="interests" placeholder="reading, english, piano" />
      <Field label="年度目标，逗号分隔" name="annualGoals" placeholder="阅读习惯, 英语启蒙" />
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      <Button type="submit">生成成长系统</Button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text"
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} placeholder={placeholder} required type={type} />
    </div>
  );
}
