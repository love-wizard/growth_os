import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/auth/family-access";

function createAuthClient(error: Error | null): SupabaseClient {
  return {
    auth: {
      getUser: async () => ({
        data: { user: null },
        error
      })
    }
  } as unknown as SupabaseClient;
}

describe("family access auth helpers", () => {
  it("treats missing Supabase auth sessions as unauthenticated users", async () => {
    const error = new Error("Auth session missing!");
    error.name = "AuthSessionMissingError";

    await expect(getAuthenticatedUser(createAuthClient(error))).resolves.toBeNull();
  });

  it("keeps unexpected Supabase auth errors visible", async () => {
    const error = new Error("Auth service unavailable");

    await expect(getAuthenticatedUser(createAuthClient(error))).rejects.toThrow(
      "Auth service unavailable"
    );
  });
});
