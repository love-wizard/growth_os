import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { getParentProfile, upsertParentProfile } from "@/lib/repositories/parent-profile-repo";
import { createGrowthMediaSignedReadUrl, growthRecordBucket } from "@/lib/services/storage-service";

export class ParentProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParentProfileError";
  }
}

function fallbackDisplayName(role?: string) {
  if (role === "father") {
    return "爸爸";
  }

  if (role === "mother") {
    return "妈妈";
  }

  return "微信家长";
}

function buildParentAvatarStoragePath(input: {
  familyId: UUID;
  userId: UUID;
  fileName: string;
}) {
  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${input.familyId}/parent-profiles/${input.userId}/${Date.now()}-${safeFileName}`;
}

export async function getParentProfileForFamily(
  supabase: SupabaseClient,
  storageSupabase: SupabaseClient,
  input: {
    familyId: UUID;
    userId: UUID;
    role?: string;
  }
) {
  const profile = await getParentProfile(supabase, input);

  if (!profile) {
    return {
      displayName: fallbackDisplayName(input.role),
      avatarUrl: ""
    };
  }

  let avatarUrl = "";
  if (profile.avatar_storage_path) {
    const signed = await createGrowthMediaSignedReadUrl(
      storageSupabase,
      profile.avatar_storage_path
    );
    avatarUrl = signed.signedUrl;
  }

  return {
    displayName: profile.display_name,
    avatarUrl
  };
}

export async function saveParentDisplayNameForFamily(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    userId: UUID;
    displayName: string;
    role?: string;
  }
) {
  const normalized = input.displayName.trim() || fallbackDisplayName(input.role);
  const current = await getParentProfile(supabase, input);

  await upsertParentProfile(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    displayName: normalized,
    avatarStoragePath: current?.avatar_storage_path ?? null
  });
}

export async function saveParentAvatarForFamily(
  supabase: SupabaseClient,
  storageSupabase: SupabaseClient,
  input: {
    familyId: UUID;
    userId: UUID;
    displayName: string;
    role?: string;
    file: File;
  }
) {
  if (!input.file.type.startsWith("image/")) {
    throw new ParentProfileError("Only image avatar is supported");
  }

  if (input.file.size > 5 * 1024 * 1024) {
    throw new ParentProfileError("Avatar must be 5MB or smaller");
  }

  const current = await getParentProfile(supabase, input);
  const displayName = input.displayName.trim() || current?.display_name || fallbackDisplayName(input.role);
  const fileName = input.file.name || "avatar.jpg";
  const storagePath = buildParentAvatarStoragePath({
    familyId: input.familyId,
    userId: input.userId,
    fileName
  });

  const { error } = await storageSupabase.storage
    .from(growthRecordBucket)
    .upload(storagePath, await input.file.arrayBuffer(), {
      contentType: input.file.type || "image/jpeg",
      upsert: false
    });

  if (error) {
    throw error;
  }

  await upsertParentProfile(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    displayName,
    avatarStoragePath: storagePath
  });

  const signed = await createGrowthMediaSignedReadUrl(storageSupabase, storagePath);

  return {
    displayName,
    avatarUrl: signed.signedUrl
  };
}
