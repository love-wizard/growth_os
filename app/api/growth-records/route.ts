import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import {
  GrowthRecordError,
  listGrowthRecordsForFamily,
  saveGrowthRecord
} from "@/lib/services/growth-record-service";
import {
  familyGrowthRecordsCacheKey,
  getCachedResponse,
  invalidateFamilyReadCaches,
  setCachedResponse
} from "@/lib/services/response-cache";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { growthRecordInputSchema } from "@/lib/validation/schemas";

const growthRecordsCacheTtlMs = 60 * 1000;

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const serviceRoleSupabase = createServiceRoleSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const cacheKey = familyGrowthRecordsCacheKey(membership.family_id);
    const cachedRecords = getCachedResponse(cacheKey);
    if (cachedRecords) {
      return NextResponse.json({ records: cachedRecords });
    }

    const records = await listGrowthRecordsForFamily(supabase, serviceRoleSupabase, {
      familyId: membership.family_id,
      limit: 20
    });

    setCachedResponse(cacheKey, records, growthRecordsCacheTtlMs);
    return NextResponse.json({ records });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    console.error("Unable to load growth records", error);
    return NextResponse.json({ error: "Unable to load growth records" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const body = growthRecordInputSchema.parse(await request.json());
    const record = await saveGrowthRecord(supabase, {
      familyId: membership.family_id,
      userId: user.id,
      record: body
    });

    invalidateFamilyReadCaches(membership.family_id);
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    if (error instanceof GrowthRecordError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json({ error: "Unable to create growth record" }, { status: 400 });
  }
}
