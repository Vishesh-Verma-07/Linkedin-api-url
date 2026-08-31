import { describe, it, expect } from "vitest";
import { requireSessionEnv, requirePort } from "./env";

describe("requireSessionEnv", () => {
  it("returns the session values when both are present", () => {
    const env = { LINKEDIN_LI_AT: "li-at", LINKEDIN_JSESSIONID: "jsid" };
    expect(requireSessionEnv(env)).toEqual({ liAt: "li-at", jsessionid: "jsid" });
  });

  it("throws a clear error when LINKEDIN_LI_AT is missing", () => {
    expect(() => requireSessionEnv({ LINKEDIN_JSESSIONID: "jsid" })).toThrow(/LINKEDIN_LI_AT/);
  });

  it("throws a clear error when LINKEDIN_JSESSIONID is missing", () => {
    expect(() => requireSessionEnv({ LINKEDIN_LI_AT: "li-at" })).toThrow(/LINKEDIN_JSESSIONID/);
  });
});

describe("requirePort", () => {
  it("defaults to 4000 when unset", () => {
    expect(requirePort({})).toBe(4000);
  });

  it("parses the PORT override", () => {
    expect(requirePort({ PORT: "5000" })).toBe(5000);
  });
});
