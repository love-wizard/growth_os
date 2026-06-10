import type { SupabaseClient, User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import type {
  FamilyMemberAccess,
  InternalReviewerAccess,
  InternalReviewerType,
  ParentRole,
  UUID
} from "@/lib/domain/types";
import { elapsedMs, logPerf, nowMs } from "@/lib/services/perf-log";

type CachedUser = {
  expiresAt: number;
  user: User;
};

const authenticatedUserCache = new Map<string, CachedUser>();
const maxAuthenticatedUserCacheMs = 5 * 60 * 1000;

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication is required");
    this.name = "AuthRequiredError";
  }
}

export class FamilyAccessError extends Error {
  constructor(familyId: UUID) {
    super(`User does not have access to family ${familyId}`);
    this.name = "FamilyAccessError";
  }
}

export class InternalReviewerAccessError extends Error {
  constructor() {
    super("Active internal reviewer access is required");
    this.name = "InternalReviewerAccessError";
  }
}

function isAuthSessionMissingError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "AuthSessionMissingError" ||
      error.message.toLowerCase().includes("auth session missing") ||
      error.message.toLowerCase().includes("invalid jwt") ||
      error.message.toLowerCase().includes("token is expired") ||
      error.message.toLowerCase().includes("bad_jwt"))
  );
}

async function getBearerAccessToken() {
  try {
    const authorization = (await headers()).get("authorization");
    if (!authorization?.toLowerCase().startsWith("bearer ")) {
      return null;
    }

    return authorization.slice("bearer ".length).trim();
  } catch {
    return null;
  }
}

function getJwtExpiresAt(accessToken: string) {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(Buffer.from(normalizedPayload, "base64").toString("utf8")) as {
      exp?: number;
    };

    return parsed.exp ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}

function getCachedAuthenticatedUser(accessToken: string) {
  const cached = authenticatedUserCache.get(accessToken);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    authenticatedUserCache.delete(accessToken);
    return null;
  }

  return cached.user;
}

function setCachedAuthenticatedUser(accessToken: string, user: User) {
  const tokenExpiresAt = getJwtExpiresAt(accessToken);
  const expiresAt = Math.min(
    Date.now() + maxAuthenticatedUserCacheMs,
    tokenExpiresAt ? tokenExpiresAt - 30 * 1000 : Number.POSITIVE_INFINITY
  );

  if (expiresAt <= Date.now()) {
    return;
  }

  authenticatedUserCache.set(accessToken, {
    expiresAt,
    user
  });
}

export async function getAuthenticatedUser(
  supabase: SupabaseClient
): Promise<User | null> {
  const startedAt = nowMs();
  const bearerAccessToken = await getBearerAccessToken();
  if (bearerAccessToken) {
    const cachedUser = getCachedAuthenticatedUser(bearerAccessToken);
    if (cachedUser) {
      logPerf("auth.user", {
        totalMs: elapsedMs(startedAt),
        cache: "hit",
        userId: cachedUser.id
      });
      return cachedUser;
    }
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    if (isAuthSessionMissingError(error)) {
      return null;
    }

    throw error;
  }

  if (user && bearerAccessToken) {
    setCachedAuthenticatedUser(bearerAccessToken, user);
  }

  logPerf("auth.user", {
    totalMs: elapsedMs(startedAt),
    cache: bearerAccessToken ? "miss" : "none",
    userId: user?.id
  });

  return user;
}

export async function requireAuthenticatedUser(
  supabase: SupabaseClient
): Promise<User> {
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    throw new AuthRequiredError();
  }

  return user;
}

export async function requireFamilyMemberAccess(
  supabase: SupabaseClient,
  familyId: UUID
): Promise<FamilyMemberAccess> {
  const user = await requireAuthenticatedUser(supabase);
  const { data, error } = await supabase
    .from("family_members")
    .select("family_id,user_id,role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .eq("invitation_status", "accepted")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new FamilyAccessError(familyId);
  }

  return {
    familyId: data.family_id as UUID,
    userId: data.user_id as UUID,
    role: data.role as ParentRole
  };
}

export async function requireInternalReviewerAccess(
  supabase: SupabaseClient,
  allowedTypes?: readonly InternalReviewerType[]
): Promise<InternalReviewerAccess> {
  const user = await requireAuthenticatedUser(supabase);
  let query = supabase
    .from("internal_reviewers")
    .select("id,user_id,reviewer_type")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (allowedTypes && allowedTypes.length > 0) {
    query = query.in("reviewer_type", [...allowedTypes]);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new InternalReviewerAccessError();
  }

  return {
    reviewerId: data.id as UUID,
    userId: data.user_id as UUID,
    reviewerType: data.reviewer_type as InternalReviewerType
  };
}
