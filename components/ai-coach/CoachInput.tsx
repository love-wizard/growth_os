"use client";

import { Send } from "lucide-react";
import { useState } from "react";

export function CoachInput({
  initialQuestion = "",
  onSubmit
}: {
  initialQuestion?: string;
  onSubmit?: (message: string) => void;
}) {
  const [message, setMessage] = useState(initialQuestion);

  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (message.trim()) {
          onSubmit?.(message.trim());
        }
      }}
    >
      <input
        className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        onChange={(event) => setMessage(event.target.value)}
        placeholder="请输入育儿问题"
        value={message}
      />
      <button
        aria-label="发送问题"
        className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground"
        type="submit"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
