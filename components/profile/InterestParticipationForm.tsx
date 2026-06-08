"use client";

import { Save } from "lucide-react";

export function InterestParticipationForm() {
  return (
    <form className="grid gap-3 rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">兴趣参与记录</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">兴趣项目</span>
          <select className="rounded-md border border-input bg-background px-3 py-2">
            <option>钢琴</option>
            <option>游泳</option>
            <option>阅读</option>
            <option>英语</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">发生日期</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            defaultValue="2026-06-08"
            type="date"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">结果</span>
          <select className="rounded-md border border-input bg-background px-3 py-2">
            <option>已完成</option>
            <option>未参加</option>
            <option>已取消</option>
            <option>已改期</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">时长</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            defaultValue="20"
            min="0"
            type="number"
          />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">备注</span>
        <textarea
          className="min-h-24 rounded-md border border-input bg-background px-3 py-2"
          defaultValue="第一次主动练琴20分钟。"
        />
      </label>
      <button
        className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        type="button"
      >
        <Save className="h-4 w-4" aria-hidden="true" />
        保存记录
      </button>
    </form>
  );
}
