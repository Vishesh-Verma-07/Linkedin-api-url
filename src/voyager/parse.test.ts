import { describe, it, expect } from "vitest";
import { parsePublicIdentifier } from "./parse";

describe("parsePublicIdentifier", () => {
  it("extracts a slug from a linkedin.com/in URL", () => {
    expect(parsePublicIdentifier("https://www.linkedin.com/in/satyanadella")).toBe(
      "satyanadella",
    );
  });

  it("extracts a slug ignoring a trailing slash and query string", () => {
    expect(parsePublicIdentifier("https://www.linkedin.com/in/satyanadella/?trk=foo")).toBe(
      "satyanadella",
    );
  });

  it("treats a bare string as the public identifier", () => {
    expect(parsePublicIdentifier("satyanadella")).toBe("satyanadella");
  });

  it("returns null for an empty or whitespace input", () => {
    expect(parsePublicIdentifier("")).toBeNull();
    expect(parsePublicIdentifier("   ")).toBeNull();
  });

  it("returns null for an identifier with illegal characters", () => {
    expect(parsePublicIdentifier("has space")).toBeNull();
    expect(parsePublicIdentifier("a/b")).toBeNull();
    expect(parsePublicIdentifier("a?b=1")).toBeNull();
    expect(parsePublicIdentifier("https://example.com/not-linkedin/x")).toBeNull();
  });
});
