import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { UUID } from "@/lib/domain/types";
import { recordProductMetricEvent } from "@/lib/metrics/product-events";

export const paymentIntentSignalSchema = z.object({
  packageConcept: z.enum([
    "basic_ai_archive",
    "plus_monthly_analysis",
    "high_trust_expert_reviewed"
  ]),
  pricePoint: z.enum(["rmb_19_month", "rmb_29_month", "rmb_49_month"]),
  intentLevel: z.enum(["not_now", "maybe", "high"]),
  reason: z.string().trim().optional()
});

export type PaymentIntentSignal = z.infer<typeof paymentIntentSignalSchema>;

export async function recordPaymentIntentSignal(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; signal: PaymentIntentSignal }
) {
  const { data, error } = await supabase
    .from("payment_intent_signals")
    .insert({
      family_id: input.familyId,
      package_concept: input.signal.packageConcept,
      price_point: input.signal.pricePoint,
      intent_level: input.signal.intentLevel,
      reason: input.signal.reason ?? null
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  await recordProductMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: "payment_intent_recorded",
    eventProperties: {
      signalId: data.id,
      packageConcept: input.signal.packageConcept,
      pricePoint: input.signal.pricePoint,
      intentLevel: input.signal.intentLevel
    }
  });

  return data.id as UUID;
}
