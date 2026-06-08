"use client";

const reminderPreferences = [
  { id: "evening_companionship", label: "晚间陪伴" },
  { id: "weekend_planning", label: "周末计划" },
  { id: "accepted_suggestion_follow_up", label: "建议跟进" },
  { id: "weekly_reset", label: "每周重启" }
];

export function ReminderPreferences() {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">温和提醒</h2>
      <div className="mt-4 grid gap-3">
        {reminderPreferences.map((preference) => (
          <label
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm"
            key={preference.id}
          >
            <span>{preference.label}</span>
            <input className="h-4 w-4" type="checkbox" />
          </label>
        ))}
      </div>
    </section>
  );
}
