import { describe, it, expect } from "vitest";
import { mapSections } from "./sections";
import { sectionedProfileFixture } from "./fixtures";

describe("mapSections", () => {
  it("maps experience into a flat list with company inherited from the position group", () => {
    const { experience } = mapSections(sectionedProfileFixture());

    expect(experience).toEqual([
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
    ]);
  });

  it("skips position groups that resolve to no positions", () => {
    const { experience } = mapSections(sectionedProfileFixture());

    const fictionalBooks = experience.find((item) => item.company === "Fictional Books");
    expect(fictionalBooks).toBeUndefined();
  });

  it("maps education with school, degree, fieldOfStudy and plain dates", () => {
    const { education } = mapSections(sectionedProfileFixture());

    expect(education).toEqual([
      {
        school: "University of Chicago",
        degree: "Bachelor's degree",
        fieldOfStudy: "Computer Science",
        startDate: { year: 1986, month: 9, day: null },
        endDate: { year: 1990, month: 6, day: null },
      },
    ]);
  });

  it("maps skills with name and endorsementCount", () => {
    const { skills } = mapSections(sectionedProfileFixture());

    expect(skills).toEqual([
      { name: "Leadership", endorsementCount: 1234 },
      { name: "Cloud Computing", endorsementCount: null },
    ]);
  });

  it("maps certifications with name, authority and plain dates", () => {
    const { certifications } = mapSections(sectionedProfileFixture());

    expect(certifications).toEqual([
      {
        name: "AWS Certified Solutions Architect",
        authority: "Amazon Web Services",
        startDate: { year: 2019, month: 5, day: null },
        endDate: null,
      },
    ]);
  });

  it("maps languages with name and proficiency", () => {
    const { languages } = mapSections(sectionedProfileFixture());

    expect(languages).toEqual([
      { name: "English", proficiency: "NATIVE_OR_BILINGUAL" },
      { name: "Spanish", proficiency: "FULL_PROFESSIONAL" },
    ]);
  });

  it("renders empty arrays for missing sections", () => {
    const sections = mapSections({ included: [] });

    expect(sections).toEqual({
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: [],
    });
  });
});