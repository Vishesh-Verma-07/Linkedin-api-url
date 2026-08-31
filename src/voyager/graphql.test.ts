import { describe, it, expect } from "vitest";
import { parseAboutGraphql, parseContactGraphql, type Contact } from "./graphql";
import { aboutGraphqlFixture, contactGraphqlFixture } from "./fixtures";

describe("parseAboutGraphql", () => {
  it("extracts the about text from a profile-components GraphQL payload", () => {
    expect(parseAboutGraphql(aboutGraphqlFixture())).toBe(
      "Satya Nadella is the Chairman and Chief Executive Officer of Microsoft.",
    );
  });

  it("returns null when the about text is missing", () => {
    expect(parseAboutGraphql({ data: { profileComponents: { components: [] } } })).toBeNull();
    expect(parseAboutGraphql({})).toBeNull();
  });
});

describe("parseContactGraphql", () => {
  it("maps a profile-contact-infos GraphQL payload to readable fields", () => {
    expect(parseContactGraphql(contactGraphqlFixture())).toEqual<Contact>({
      emailAddress: "satya@example.com",
      phoneNumbers: ["+1 555-0100"],
      websites: [
        { label: "Company", url: "https://news.microsoft.com/exec/satya" },
        { label: "Personal", url: "https://satya.dev" },
      ],
      address: "Redmond, Washington",
    });
  });

  it("renders null / empty arrays when fields are missing", () => {
    expect(parseContactGraphql({ data: { profileContactInfos: {} } })).toEqual<Contact>({
      emailAddress: null,
      phoneNumbers: [],
      websites: [],
      address: null,
    });
  });
});
