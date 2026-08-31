import { describe, it, expect } from "vitest";
import { fetchProfile } from "./fetch";
import type { VoyagerPayload } from "./payload";
import { AuthRedirectError, UnexpectedHtmlError } from "./errors";

const FULL_93 =
  "com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-93";
const FULL_138 = "com.linkedin.voyager.dash.deco.identity.profile.FullProfile-138";

function fixture(): VoyagerPayload {
  return {
    included: [
      {
        $type: "com.linkedin.voyager.dash.identity.profile.Profile",
        entityUrn: "urn:li:person:123",
        publicIdentifier: "satyanadella",
        firstName: "Satya",
        lastName: "Nadella",
        headline: "CEO",
        locationName: "Seattle",
        geoLocation: { country: "us" },
      },
    ],
  };
}

function transportResponding(
  responder: (url: string) => { status: number; data: unknown },
) {
  const urls: string[] = [];
  const transport = {
    async request({ url }: { url: string }) {
      urls.push(url);
      return responder(url);
    },
  };
  return { transport, urls };
}

describe("fetchProfile", () => {
  it("requests the decorated-profiles endpoint with FullProfileWithEntities-93 and maps identity fields", async () => {
    const { transport, urls } = transportResponding(() => ({ status: 200, data: fixture() }));

    const profile = await fetchProfile(transport, "satyanadella");

    expect(urls[0]).toContain("/voyager/api/identity/dash/profiles");
    expect(urls[0]).toContain("q=memberIdentity");
    expect(urls[0]).toContain("memberIdentity=satyanadella");
    expect(urls[0]).toContain(`decorationId=${FULL_93}`);
    expect(profile.id).toBe(123);
    expect(profile.publicIdentifier).toBe("satyanadella");
    expect(profile.fullName).toBe("Satya Nadella");
  });

  it("falls back to FullProfile-138 when the first decoration fails, then succeeds", async () => {
    let calls = 0;
    const { transport, urls } = transportResponding((url) => {
      calls += 1;
      if (calls === 1) return { status: 500, data: { message: "boom" } };
      return { status: 200, data: fixture() };
    });

    const profile = await fetchProfile(transport, "satyanadella");

    expect(urls[0]).toContain(`decorationId=${FULL_93}`);
    expect(urls[1]).toContain(`decorationId=${FULL_138}`);
    expect(profile.id).toBe(123);
  });

  it("raises AuthRedirectError on a 3xx response and does not fall back", async () => {
    const { transport, urls } = transportResponding(() => ({
      status: 302,
      data: "",
    }));

    await expect(fetchProfile(transport, "x")).rejects.toBeInstanceOf(AuthRedirectError);
    expect(urls).toHaveLength(1);
  });

  it("raises UnexpectedHtmlError on an HTML body and does not fall back", async () => {
    const { transport, urls } = transportResponding(() => ({
      status: 200,
      data: "<!DOCTYPE html><html><body>authwall</body></html>",
    }));

    await expect(fetchProfile(transport, "x")).rejects.toBeInstanceOf(UnexpectedHtmlError);
    expect(urls).toHaveLength(1);
  });
});
