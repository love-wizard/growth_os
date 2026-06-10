import { describe, expect, it } from "vitest";
import {
  deleteCachedResponsesByPrefix,
  getCachedResponse,
  setCachedResponse
} from "@/lib/services/response-cache";

describe("response cache", () => {
  it("returns cached values before expiry", () => {
    setCachedResponse("test:cache:hit", { ok: true }, 1000);

    expect(getCachedResponse("test:cache:hit")).toEqual({ ok: true });
  });

  it("deletes cached values by prefix", () => {
    setCachedResponse("test:family:one", "one", 1000);
    setCachedResponse("test:family:two", "two", 1000);
    setCachedResponse("test:other", "other", 1000);

    deleteCachedResponsesByPrefix("test:family:");

    expect(getCachedResponse("test:family:one")).toBeNull();
    expect(getCachedResponse("test:family:two")).toBeNull();
    expect(getCachedResponse("test:other")).toBe("other");
  });
});
