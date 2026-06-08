export function PaymentIntentSurvey() {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">私测反馈</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {["基础成长档案", "月度成长分析", "专家抽检版本"].map((label) => (
          <button
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            key={label}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
