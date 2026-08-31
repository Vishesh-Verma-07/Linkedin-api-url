import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "./app";
import type { VoyagerClient } from "./voyager/client";
import type { Profile } from "./voyager/profile";
import { fetchProfile } from "./voyager/fetch";
import { sectionedProfileFixture } from "./voyager/fixtures";

const nadellaProfile: Profile = {
  id: 123456789,
  publicIdentifier: "satyanadella",
  firstName: "Satya",
  lastName: "Nadella",
  fullName: "Satya Nadella",
  headline: "Chairman and CEO at Microsoft",
  about: "Satya Nadella is the Chairman and Chief Executive Officer of Microsoft.",
  location: "Seattle, Washington",
  countryCode: "us",
  avatarUrl: "https://media.licdn.com/dms/image/profile-displayphoto",
  backgroundUrl: "https://media.licdn.com/dms/image/background",
  followersCount: 37000000,
  connectionsCount: 5000,
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
};

function clientReturning(profile: Profile, onGet?: (identifier: string) => void): VoyagerClient {
  return {
    kind: "voyager-client",
    async getProfile(identifier: string) {
      onGet?.(identifier);
      return profile;
    },
  };
}

const fakeClient = clientReturning(nadellaProfile, () => {});

describe("GET /health", () => {
  it("returns ok status and a timestamp", async () => {
    const res = await request(createApp(fakeClient)).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
  });
});

describe("security middleware", () => {
  it("sets a helmet security header", async () => {
    const res = await request(createApp(fakeClient)).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});

describe("GET /api/profile", () => {
  it("returns flat readable identity JSON for a linkedin.com/in URL", async () => {
    const got = vi.fn();
    const res = await request(
      createApp(clientReturning(nadellaProfile, got)),
    ).get("/api/profile?url=https://www.linkedin.com/in/satyanadella");

    expect(res.status).toBe(200);
    expect(got).toHaveBeenCalledWith("satyanadella");
    expect(res.body).toEqual(nadellaProfile);
  });

  it("returns the same shape for a bare public identifier", async () => {
    const got = vi.fn();
    const res = await request(
      createApp(clientReturning(nadellaProfile, got)),
    ).get("/api/profile?url=satyanadella");

    expect(res.status).toBe(200);
    expect(got).toHaveBeenCalledWith("satyanadella");
    expect(res.body).toEqual(nadellaProfile);
  });

  it("exposes every section from a green fixture payload at the HTTP seam", async () => {
    const client: VoyagerClient = {
      kind: "voyager-client",
      async getProfile(identifier) {
        const transport = {
          async request({ url }: { url: string }) {
            if (!url.includes("decorationId=com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-93")) {
              return { status: 404, data: {} };
            }
            return { status: 200, data: sectionedProfileFixture() };
          },
        };
        return fetchProfile(transport, identifier);
      },
    };

    const res = await request(createApp(client)).get(
      "/api/profile?url=https://www.linkedin.com/in/satyanadella",
    );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 0,
      publicIdentifier: "satyanadella",
      firstName: "Satya",
      lastName: "Nadella",
      fullName: "Satya Nadella",
      headline: "Chairman and CEO at Microsoft",
      location: "Seattle, Washington",
      countryCode: "us",
      experience: [
        {
          title: "Chief Executive Officer",
          company: "Microsoft",
          location: "Redmond, WA",
          employmentType: "Full-time",
          startDate: { year: 2014, month: 2, day: null },
          endDate: { year: 2018, month: 3, day: null },
          description: "Led the transformation to a cloud-first company.",
        },
        {
          title: "Executive Vice President, Cloud and Enterprise",
          company: "Microsoft",
          location: "Redmond, WA",
          employmentType: "Full-time",
          startDate: { year: 2011, month: 2, day: null },
          endDate: null,
          description: null,
        },
      ],
      education: [
        {
          school: "University of Chicago",
          degree: "Bachelor's degree",
          fieldOfStudy: "Computer Science",
          startDate: { year: 1986, month: 9, day: null },
          endDate: { year: 1990, month: 6, day: null },
        },
      ],
      skills: [
        { name: "Leadership", endorsementCount: 1234 },
        { name: "Cloud Computing", endorsementCount: null },
      ],
      certifications: [
        {
          name: "AWS Certified Solutions Architect",
          authority: "Amazon Web Services",
          startDate: { year: 2019, month: 5, day: null },
          endDate: null,
        },
      ],
      languages: [
        { name: "English", proficiency: "NATIVE_OR_BILINGUAL" },
        { name: "Spanish", proficiency: "FULL_PROFESSIONAL" },
      ],
    });
  });
});
