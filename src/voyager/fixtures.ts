import type { VoyagerPayload } from "./payload";
import {
  PROFILE_TYPE,
  COLLECTION_TYPE,
  POSITION_GROUP_TYPE,
  POSITION_TYPE,
  EDUCATION_TYPE,
  SKILL_TYPE,
  CERTIFICATION_TYPE,
  LANGUAGE_TYPE,
  EMPLOYMENT_TYPE_TYPE,
} from "./dash";

const DATE = "com.linkedin.common.Date";
const DATE_RANGE = "com.linkedin.common.DateRange";

const PROFILE = "urn:li:fsd_profile:ACoAAABjFuMBHhkeqe_cSk1_5fNcRa3Q1TZ8j0k";
const GROUP_1 = `urn:li:fsd_profilePositionGroup:(${PROFILE},grp1)`;
const GROUP_2 = `urn:li:fsd_profilePositionGroup:(${PROFILE},grp2)`;
const POSITION_1 = `urn:li:fsd_profilePosition:(${PROFILE},pos1)`;
const POSITION_2 = `urn:li:fsd_profilePosition:(${PROFILE},pos2)`;
const EDUCATION_1 = `urn:li:fsd_profileEducation:(${PROFILE},edu1)`;
const SKILL_1 = `urn:li:fsd_skill:(${PROFILE},skill1)`;
const SKILL_2 = `urn:li:fsd_skill:(${PROFILE},skill2)`;
const CERT_1 = `urn:li:fsd_profileCertification:(${PROFILE},cert1)`;
const LANG_1 = `urn:li:fsd_profileLanguage:(${PROFILE},lang1)`;
const LANG_2 = `urn:li:fsd_profileLanguage:(${PROFILE},lang2)`;

const collection = (
  entityUrn: string,
  elements: string[],
): Record<string, unknown> => ({
  $type: COLLECTION_TYPE,
  entityUrn,
  paging: { start: 0, count: elements.length, total: elements.length },
  "*elements": elements,
});

/**
 * Green FullProfileWithEntities-93 payload covering every detail section,
 * modelled on the real Voyager dash shapes: the profile entry holds
 * star-collection references to CollectionResponse shells, whose *elements
 * point at section entities resolved from the same included[] array.
 */
export function sectionedProfileFixture(): VoyagerPayload {
  return {
    included: [
      {
        $type: PROFILE_TYPE,
        entityUrn: PROFILE,
        publicIdentifier: "satyanadella",
        firstName: "Satya",
        lastName: "Nadella",
        headline: "Chairman and CEO at Microsoft",
        about: "Satya Nadella is the Chairman and Chief Executive Officer of Microsoft.",
        locationName: "Seattle, Washington",
        geoLocation: { country: "us" },
        "*profilePositionGroups": "urn:li:collectionResponse:positionGroups",
        "*profileEducations": "urn:li:collectionResponse:educations",
        "*profileSkills": "urn:li:collectionResponse:skills",
        "*profileCertifications": "urn:li:collectionResponse:certifications",
        "*profileLanguages": "urn:li:collectionResponse:languages",
      },
      collection("urn:li:collectionResponse:positionGroups", [GROUP_1, GROUP_2]),
      {
        $type: POSITION_GROUP_TYPE,
        entityUrn: GROUP_1,
        companyName: "Microsoft",
        dateRange: {
          start: { year: 2014, month: 2, $type: DATE },
          end: { year: 2018, month: 3, $type: DATE },
          $type: DATE_RANGE,
        },
        "*profilePositionInPositionGroup": "urn:li:collectionResponse:group1Positions",
      },
      {
        $type: POSITION_GROUP_TYPE,
        entityUrn: GROUP_2,
        companyName: "Fictional Books",
        dateRange: { start: { year: 2018, month: 4, $type: DATE }, $type: DATE_RANGE },
        "*profilePositionInPositionGroup": "urn:li:collectionResponse:group2Positions",
      },
      collection("urn:li:collectionResponse:group1Positions", [POSITION_1, POSITION_2]),
      {
        $type: POSITION_TYPE,
        entityUrn: POSITION_1,
        title: "Chief Executive Officer",
        companyName: "Microsoft",
        locationName: "Redmond, WA",
        employmentType: "urn:li:fsd_employmentType:12",
        description: "Led the transformation to a cloud-first company.",
        dateRange: {
          start: { year: 2014, month: 2, $type: DATE },
          end: { year: 2018, month: 3, $type: DATE },
          $type: DATE_RANGE,
        },
      },
      {
        $type: POSITION_TYPE,
        entityUrn: POSITION_2,
        title: "Executive Vice President, Cloud and Enterprise",
        locationName: "Redmond, WA",
        employmentType: "urn:li:fsd_employmentType:12",
        dateRange: { start: { year: 2011, month: 2, $type: DATE }, $type: DATE_RANGE },
      },
      collection("urn:li:collectionResponse:group2Positions", []),
      { $type: EMPLOYMENT_TYPE_TYPE, entityUrn: "urn:li:fsd_employmentType:12", name: "Full-time" },
      collection("urn:li:collectionResponse:educations", [EDUCATION_1]),
      {
        $type: EDUCATION_TYPE,
        entityUrn: EDUCATION_1,
        schoolName: "University of Chicago",
        degreeName: "Bachelor's degree",
        fieldOfStudy: "Computer Science",
        dateRange: {
          start: { year: 1986, month: 9, $type: DATE },
          end: { year: 1990, month: 6, $type: DATE },
          $type: DATE_RANGE,
        },
      },
      collection("urn:li:collectionResponse:skills", [SKILL_1, SKILL_2]),
      { $type: SKILL_TYPE, entityUrn: SKILL_1, name: "Leadership", endorsementCount: 1234 },
      { $type: SKILL_TYPE, entityUrn: SKILL_2, name: "Cloud Computing" },
      collection("urn:li:collectionResponse:certifications", [CERT_1]),
      {
        $type: CERTIFICATION_TYPE,
        entityUrn: CERT_1,
        name: "AWS Certified Solutions Architect",
        authority: "Amazon Web Services",
        dateRange: { start: { year: 2019, month: 5, $type: DATE }, $type: DATE_RANGE },
      },
      collection("urn:li:collectionResponse:languages", [LANG_1, LANG_2]),
      { $type: LANGUAGE_TYPE, entityUrn: LANG_1, name: "English", proficiency: "NATIVE_OR_BILINGUAL" },
      { $type: LANGUAGE_TYPE, entityUrn: LANG_2, name: "Spanish", proficiency: "FULL_PROFESSIONAL" },
    ],
  };
}