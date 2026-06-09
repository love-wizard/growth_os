import type { SupabaseClient, User } from "@supabase/supabase-js";
import type {
  FamilyMemberAccess,
  InternalReviewerAccess,
  InternalReviewerType,
  ParentRole,
  UUID
} from "@/lib/domain/types";

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

export async function getAuthenticatedUser(
  supabase: SupabaseClient
): Promise<User | null> {
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
