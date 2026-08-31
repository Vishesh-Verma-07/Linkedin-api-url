import { describe, it, expect } from "vitest";
import { fetchProfile } from "./fetch";
import type { VoyagerPayload } from "./payload";
import { AuthRedirectError, UnexpectedHtmlError } from "./errors";
import { aboutGraphqlFixture, contactGraphqlFixture } from "./fixtures";
import { ABOUT_QUERY_ID, CONTACT_QUERY_ID } from "./graphql";
import type { VoyagerTransport } from "./transport";

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

function profileWithoutAbout(): VoyagerPayload {
  return {
    included: [
      {
        $type: "com.linkedin.voyager.dash.identity.profile.Profile",
        entityUrn: "urn:li:fsd_profile:ACoAAABjFuMBHhkeqe_cSk1_5fNcRa3Q1TZ8j0k",
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

function routingTransport(handlers: {
  decorated?: () => { status: number; data: unknown };
  graphql?: (url: string) => { status: number; data: unknown };
}) {
  const urls: string[] = [];
  const transport: VoyagerTransport = {
    async request({ url }) {
      urls.push(url);
      if (url.includes("/voyager/api/graphql")) {
        return handlers.graphql ? handlers.graphql(url) : { status: 404, data: {} };
      }
      return handlers.decorated
        ? handlers.decorated()
        : { status: 404, data: {} };
    },
  };
  return { transport, urls };
}

describe("fetchProfile GraphQL fallbacks", () => {
  it("fetches about and contact via their queryIds when the payload omits them", async () => {
    const graphql: string[] = [];
    const { transport } = routingTransport({
      decorated: () => ({ status: 200, data: profileWithoutAbout() }),
      graphql: (url) => {
        graphql.push(url);
        if (url.includes(ABOUT_QUERY_ID)) return { status: 200, data: aboutGraphqlFixture() };
        return { status: 200, data: contactGraphqlFixture() };
      },
    });

    const profile = await fetchProfile(transport, "satyanadella");

    expect(graphql.some((u) => u.includes(ABOUT_QUERY_ID))).toBe(true);
    expect(graphql.some((u) => u.includes(CONTACT_QUERY_ID))).toBe(true);
    expect(profile.about).toBe(
      "Satya Nadella is the Chairman and Chief Executive Officer of Microsoft.",
    );
    expect(profile.contact).toEqual({
      emailAddress: "satya@example.com",
      phoneNumbers: ["+1 555-0100"],
      websites: [
        { label: "Company", url: "https://news.microsoft.com/exec/satya" },
        { label: "Personal", url: "https://satya.dev" },
      ],
      address: "Redmond, Washington",
    });
  });

  it("skips the about fallback when the payload already has about text", async () => {
    const graphql: string[] = [];
    const payload = profileWithoutAbout();
    (payload.included![0] as Record<string, unknown>).about =
      "Sarah Nadella is already here";
    const { transport } = routingTransport({
      decorated: () => ({ status: 200, data: payload }),
      graphql: (url) => {
        graphql.push(url);
        return { status: 200, data: contactGraphqlFixture() };
      },
    });

    const profile = await fetchProfile(transport, "satyanadella");

    expect(graphql.some((u) => u.includes(ABOUT_QUERY_ID))).toBe(false);
    expect(profile.about).toBe("Sarah Nadella is already here");
  });

  it("propagates a session failure raised by a GraphQL fallback", async () => {
    const { transport } = routingTransport({
      decorated: () => ({ status: 200, data: profileWithoutAbout() }),
      graphql: () => ({ status: 302, data: "" }),
    });

    await expect(fetchProfile(transport, "satyanadella")).rejects.toBeInstanceOf(
      AuthRedirectError,
    );
  });

  it("skips the contact fallback when the payload already provides contact data", async () => {
    const graphql: string[] = [];
    const payload: VoyagerPayload = {
      included: [
        {
          $type: "com.linkedin.voyager.dash.identity.profile.Profile",
          entityUrn: "urn:li:fsd_profile:ACoAAABjFuMBHhkeqe_cSk1_5fNcRa3Q1TZ8j0k",
          publicIdentifier: "satyanadella",
          firstName: "Satya",
          lastName: "Nadella",
          headline: "CEO",
          emailAddress: "satya@microsoft.com",
          phoneNumbers: ["+1 425-555-0199"],
          websites: [{ label: "Company", url: "https://microsoft.com/satya" }],
          address: "Redmond, WA",
        },
      ],
    };
    const { transport } = routingTransport({
      decorated: () => ({ status: 200, data: payload }),
      graphql: (url) => {
        graphql.push(url);
        return { status: 200, data: contactGraphqlFixture() };
      },
    });

    const profile = await fetchProfile(transport, "satyanadella");

    expect(graphql.some((u) => u.includes(CONTACT_QUERY_ID))).toBe(false);
    expect(profile.contact).toEqual({
      emailAddress: "satya@microsoft.com",
      phoneNumbers: ["+1 425-555-0199"],
      websites: [{ label: "Company", url: "https://microsoft.com/satya" }],
      address: "Redmond, WA",
    });
  });
});
