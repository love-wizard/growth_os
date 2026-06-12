import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { getFamilyChild, listFamilyChildren } from "@/lib/repositories/child-repo";

export class ActiveChildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActiveChildError";
  }
}

export async function resolveActiveChildId(
  supabase: SupabaseClient,
  input: { familyId: UUID; childId?: UUID | null }
) {
  if (input.childId) {
    const child = await getFamilyChild(supabase, {
      familyId: input.familyId,
      childId: input.childId
    });

    if (!child) {
      throw new ActiveChildError("Selected child does not belong to this family");
    }

    return child.id;
  }

  const children = await listFamilyChildren(supabase, input.familyId);
  return children[0]?.id;
}

export function getChildIdFromRequestUrl(requestUrl: string) {
  const childId = new URL(requestUrl).searchParams.get("childId");
  return childId || undefined;
}
