import { describe, expect, it } from "vitest";
import { inviteParentRequestSchema } from "@/lib/validation/schemas";

describe("family invite API contract", () => {
  it("accepts second-parent invite email and role", () => {
    expect(
      inviteParentRequestSchema.safeParse({
        email: "parent@example.com",
        role: "mother"
      }).success
    ).toBe(true);
  });

  it("rejects unsupported roles", () => {
    expect(
      inviteParentRequestSchema.safeParse({
        email: "parent@example.com",
        role: "grandparent"
      }).success
    ).toBe(false);
  });
});
