import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/family-access";
import { getAcceptedFamilyMembership } from "@/lib/repositories/family-repo";
import { getChildIdFromRequestUrl } from "@/lib/services/active-child-service";
import {
  GrowthRecordError,
  listGrowthRecordsForFamily,
  saveGrowthRecord
} from "@/lib/services/growth-record-service";
import { elapsedMs, logPerf, nowMs } from "@/lib/services/perf-log";
import {
  familyGrowthRecordsCacheKey,
  getCachedResponse,
  invalidateFamilyReadCaches,
  setCachedResponse
} from "@/lib/services/response-cache";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { growthRecordInputSchema } from "@/lib/validation/schemas";

const growthRecordsCacheTtlMs = 60 * 1000;
const defaultGrowthRecordsLimit = 20;
const maxGrowthRecordsLimit = 50;

function getBoundedNumber(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

export async function GET(request: NextRequest) {
  const startedAt = nowMs();
  const supabase = await createServerSupabaseClient();
  const serviceRoleSupabase = createServiceRoleSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const url = new URL(request.url);
    const childId = getChildIdFromRequestUrl(request.url);
    const scope = url.searchParams.get("scope") === "family" ? "family" : "child";
    const limit = getBoundedNumber(
      url.searchParams.get("limit"),
      defaultGrowthRecordsLimit,
      1,
      maxGrowthRecordsLimit
    );
    const offset = getBoundedNumber(url.searchParams.get("offset"), 0, 0, 1000);
    const cacheKey = familyGrowthRecordsCacheKey(
      membership.family_id,
      `${scope}:${childId ?? "default"}:${limit}:${offset}`
    );
    const cachedPage = getCachedResponse(cacheKey);
    if (cachedPage) {
      logPerf("api.growth-records", {
        totalMs: elapsedMs(startedAt),
        cache: "hit",
        familyId: membership.family_id,
        recordCount:
          typeof cachedPage === "object" &&
          cachedPage !== null &&
          "records" in cachedPage &&
          Array.isArray(cachedPage.records)
            ? cachedPage.records.length
            : undefined
      });
      return NextResponse.json(cachedPage);
    }

    const loadStartedAt = nowMs();
    const page = await listGrowthRecordsForFamily(supabase, serviceRoleSupabase, {
      familyId: membership.family_id,
      childId,
      scope,
      limit,
      offset
    });

    setCachedResponse(cacheKey, page, growthRecordsCacheTtlMs);
    logPerf("api.growth-records", {
      totalMs: elapsedMs(startedAt),
      dataMs: elapsedMs(loadStartedAt),
      cache: "miss",
      familyId: membership.family_id,
      recordCount: page.records.length,
      hasMore: page.hasMore,
      nextOffset: page.nextOffset,
      mediaCount: page.records.reduce(
        (count, record) => count + (record.growth_record_media?.length ?? 0),
        0
      )
    });
    return NextResponse.json(page);
  } catch (error) {
    if (error instanceof Error && error.name === "AuthRequiredError") {
      return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
    }

    console.error("Unable to load growth records", error);
    return NextResponse.json({ error: "Unable to load growth records" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startedAt = nowMs();
  const supabase = await createServerSupabaseClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const membership = await getAcceptedFamilyMembership(supabase, user.id);

    if (!membership) {
      return NextResponse.json({ error: "Family workspace is required" }, { status: 409 });
    }

    const body = growthRecordInputSchema.parse(await request.json());
    const childId = getChildIdFromRequestUrl(request.url);
    const record = await saveGrowthRecord(supabase, {
      familyId: membership.family_id,
      childId,
      userId: user.id,
      record: body
    });

    invalidateFamilyReadCaches(membership.family_id);
    logPerf("api.growth-records.create", {
      totalMs: elapsedMs(startedAt),
      familyId: membership.family_id
    });
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
