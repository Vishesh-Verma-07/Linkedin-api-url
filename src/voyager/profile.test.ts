import { describe, it, expect } from "vitest";
import { mapProfilePayload } from "./profile";
import type { VoyagerPayload } from "./payload";

const greenFixture: VoyagerPayload = {
  included: [
    {
      $type: "com.linkedin.voyager.dash.identity.profile.Profile",
      entityUrn: "urn:li:person:123456789",
      publicIdentifier: "satyanadella",
      firstName: "Satya",
      lastName: "Nadella",
      headline: "Chairman and CEO at Microsoft",
      about: "Satya Nadella is the Chairman and Chief Executive Officer of Microsoft.",
      locationName: "Seattle, Washington",
      geoLocation: { country: "us" },
      profilePicture: {
        displayImageReference: {
          vectorImage: {
            rootUrl: "https://media.licdn.com/dms/image/",
            artifacts: [
              {
                width: 100,
                height: 100,
                fileIdentifyingUrlPathSegment:
                  "C4D03AQZabc/profile-displayphoto-shrink_100_100/0?e=1&v=alpha&t=x",
              },
            ],
          },
        },
      },
      backgroundImage: {
        displayImageReference: {
          vectorImage: {
            rootUrl: "https://media.licdn.com/dms/image/",
            artifacts: [
              {
                width: 1400,
                height: 400,
                fileIdentifyingUrlPathSegment:
                  "C4D16AQMdef/q_auto,g_fill,w_1200,ar_1:1/0?e=1&v=alpha&t=y",
              },
            ],
          },
        },
      },
    },
    {
      $type: "com.linkedin.voyager.dash.identity.profile.DashMemberConnectionCount",
      connectionsCount: 5000,
    },
    {
      $type: "com.linkedin.voyager.dash.identity.profile.FollowInfo",
      followersCount: 37000000,
    },
  ],
};

describe("mapProfilePayload", () => {
  it("maps all identity fields from a green decorated-payload fixture", () => {
    const profile = mapProfilePayload(greenFixture);

    expect(profile.id).toBe(123456789);
    expect(profile.publicIdentifier).toBe("satyanadella");
    expect(profile.firstName).toBe("Satya");
    expect(profile.lastName).toBe("Nadella");
    expect(profile.fullName).toBe("Satya Nadella");
    expect(profile.headline).toBe("Chairman and CEO at Microsoft");
    expect(profile.about).toBe(
      "Satya Nadella is the Chairman and Chief Executive Officer of Microsoft.",
    );
    expect(profile.location).toBe("Seattle, Washington");
    expect(profile.countryCode).toBe("us");
    expect(profile.avatarUrl).toContain("profile-displayphoto-shrink_100_100");
    expect(profile.backgroundUrl).toContain("q_auto,g_fill,w_1200");
    expect(profile.followersCount).toBe(37000000);
    expect(profile.connectionsCount).toBe(5000);
  });

  it("renders null for absent optional fields", () => {
    const sparse: VoyagerPayload = {
      included: [
        {
          $type: "com.linkedin.voyager.dash.identity.profile.Profile",
          entityUrn: "urn:li:person:42",
          publicIdentifier: "anon",
          firstName: "A",
          lastName: "N",
        },
      ],
    };

    const profile = mapProfilePayload(sparse);

    expect(profile.id).toBe(42);
    expect(profile.headline).toBeNull();
    expect(profile.about).toBeNull();
    expect(profile.location).toBeNull();
    expect(profile.countryCode).toBeNull();
    expect(profile.avatarUrl).toBeNull();
    expect(profile.backgroundUrl).toBeNull();
    expect(profile.followersCount).toBeNull();
    expect(profile.connectionsCount).toBeNull();
  });
});
