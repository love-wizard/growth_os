import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReminderType, UUID } from "@/lib/domain/types";

export async function upsertWarmReminderPreference(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    userId: UUID;
    reminderType: ReminderType;
    enabled: boolean;
    preferredWindow?: string;
  }
) {
  const { data, error } = await supabase
    .from("warm_reminder_preferences")
    .upsert(
      {
        family_id: input.familyId,
        user_id: input.userId,
        reminder_type: input.reminderType,
        enabled: input.enabled,
        preferred_window: input.preferredWindow ?? null
      },
      { onConflict: "family_id,user_id,reminder_type" }
    )
    .select("id,reminder_type,enabled,preferred_window")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
