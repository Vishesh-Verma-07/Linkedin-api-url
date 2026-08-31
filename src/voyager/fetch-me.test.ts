import { describe, it, expect } from "vitest";
import { fetchMe } from "./fetch-me";
import type { VoyagerPayload } from "./payload";
import { AuthRedirectError, UnexpectedHtmlError } from "./errors";
import type { VoyagerTransport } from "./transport";

function meFixture(): VoyagerPayload {
  return {
    included: [
      {
        $type: "com.linkedin.voyager.dash.identity.profile.Profile",
        entityUrn: "urn:li:fsd_profile:123",
        publicIdentifier: "satyanadella",
        firstName: "Satya",
        lastName: "Nadella",
        headline: "Chairman and CEO at Microsoft",
        locationName: "Redmond, Washington",
        geoLocation: { country: "us" },
      },
    ],
  };
}

function transportReturning(data: unknown, status = 200) {
  const urls: string[] = [];
  const transport: VoyagerTransport = {
    async request({ url }) {
      urls.push(url);
      return { status, data };
    },
  };
  return { transport, urls };
}

describe("fetchMe", () => {
  it("requests the /voyager/api/me endpoint and maps the session owner's profile", async () => {
    const { transport, urls } = transportReturning(meFixture());

    const profile = await fetchMe(transport);

    expect(urls[0]).toContain("/voyager/api/me");
    expect(profile.id).toBeGreaterThan(0);
    expect(profile.publicIdentifier).toBe("satyanadella");
    expect(profile.fullName).toBe("Satya Nadella");
    expect(profile.headline).toBe("Chairman and CEO at Microsoft");
  });

  it("raises a clear error when the mini-profile payload is empty or missing", async () => {
    const { transport } = transportReturning({ included: [] });

    await expect(fetchMe(transport)).rejects.toThrow(/profile/i);
  });

  it("raises AuthRedirectError on a 3xx response", async () => {
    const { transport } = transportReturning("", 302);

    await expect(fetchMe(transport)).rejects.toBeInstanceOf(AuthRedirectError);
  });

  it("raises UnexpectedHtmlError on an HTML body", async () => {
    const { transport } = transportReturning("<!DOCTYPE html><html></html>");

    await expect(fetchMe(transport)).rejects.toBeInstanceOf(UnexpectedHtmlError);
  });
});
