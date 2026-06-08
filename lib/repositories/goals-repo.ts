import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import type { AnnualGoalInput } from "@/lib/validation/schemas";

export async function createAnnualGoals(
  supabase: SupabaseClient,
  input: { childId: UUID; annualGoals: AnnualGoalInput[] }
) {
  const { error } = await supabase.from("annual_goals").insert(
    input.annualGoals.map((goal) => ({
      child_id: input.childId,
      title: goal.title,
      category: goal.category ?? null,
      status: "active"
    }))
  );

  if (error) {
    throw error;
  }
}
