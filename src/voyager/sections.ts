import type { VoyagerPayload, VoyagerIncludedEntity } from "./payload";
import {
  PROFILE_TYPE,
  POSITION_GROUP_TYPE,
  POSITION_TYPE,
  EMPLOYMENT_TYPE_TYPE,
  numeric,
} from "./dash";

export interface ReadableDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface ReadableDateRange {
  startDate: ReadableDate | null;
  endDate: ReadableDate | null;
}

export interface ExperienceItem extends ReadableDateRange {
  title: string | null;
  company: string | null;
  location: string | null;
  employmentType: string | null;
  description: string | null;
}

export interface EducationItem extends ReadableDateRange {
  school: string | null;
  degree: string | null;
  fieldOfStudy: string | null;
}

export interface SkillItem {
  name: string | null;
  endorsementCount: number | null;
}

export interface CertificationItem extends ReadableDateRange {
  name: string | null;
  authority: string | null;
}

export interface LanguageItem {
  name: string | null;
  proficiency: string | null;
}

export interface ProfileSections {
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  certifications: CertificationItem[];
  languages: LanguageItem[];
}

const SECTION_KEYS = {
  positionGroups: "profilePositionGroups",
  educations: "profileEducations",
  skills: "profileSkills",
  certifications: "profileCertifications",
  languages: "profileLanguages",
} as const;

type SectionEntity = VoyagerIncludedEntity;

function entityText(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;
  for (const key of ["text", "plainText", "localizedName"]) {
    if (typeof obj[key] === "string") return obj[key];
  }
  for (const localized of Object.values(obj)) {
    if (typeof localized === "string" && localized.trim()) return localized;
  }
  return null;
}

function mapDate(value: unknown): ReadableDate | null {
  if (typeof value !== "object" || value === null) return null;
  const d = value as Record<string, unknown>;
  return {
    year: typeof d.year === "number" ? d.year : null,
    month: typeof d.month === "number" ? d.month : null,
    day: typeof d.day === "number" ? d.day : null,
  };
}

function mapRange(value: unknown): ReadableDateRange {
  if (typeof value !== "object" || value === null) {
    return { startDate: null, endDate: null };
  }
  const range = value as Record<string, unknown>;
  return {
    startDate: mapDate(range.start ?? range.startDate),
    endDate: mapDate(range.end ?? range.endDate),
  };
}

function isEntity(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function findIncluded(included: SectionEntity[], urn: unknown): SectionEntity | null {
  if (typeof urn !== "string") return null;
  return included.find((entity) => entity.entityUrn === urn) ?? null;
}

function elementList(entity: SectionEntity): unknown[] {
  const elements = entity["*elements"] ?? entity["elements"];
  return Array.isArray(elements) ? elements : [];
}

function resolveReference(
  entity: SectionEntity,
  key: string,
  included: SectionEntity[],
): unknown[] {
  const ref = entity[`*${key}`] ?? entity[key];
  if (typeof ref === "string") {
    const shell = findIncluded(included, ref);
    return shell ? elementList(shell) : [];
  }
  if (Array.isArray(ref)) return ref;
  if (isEntity(ref)) {
    const urn = ref.entityUrn;
    const shell = typeof urn === "string" ? findIncluded(included, urn) : null;
    return shell ? elementList(shell) : elementList(ref);
  }
  return [];
}

function resolveElements(
  references: unknown[],
  included: SectionEntity[],
): SectionEntity[] {
  return references
    .map((reference) =>
      isEntity(reference) ? (reference as SectionEntity) : findIncluded(included, reference),
    )
    .filter(
      (entity): entity is SectionEntity =>
        entity !== null && entity.$type !== undefined,
    );
}

function byType(entities: SectionEntity[], type: string): SectionEntity[] {
  return entities.filter((entity) => entity.$type === type);
}

function sectionsFor(
  payload: VoyagerPayload,
  key: keyof typeof SECTION_KEYS,
): { entries: SectionEntity[]; included: SectionEntity[] } {
  const included = Array.isArray(payload.included) ? payload.included : [];
  const profile = included.find((entity) => entity.$type === PROFILE_TYPE);
  if (!profile) return { entries: [], included };
  const refs = resolveReference(profile, SECTION_KEYS[key], included);
  const entries = resolveElements(refs, included);
  return { entries, included };
}

function employmentTypeName(
  position: SectionEntity,
  included: SectionEntity[],
): string | null {
  const urn = position.employmentType ?? position["*employmentType"];
  if (typeof urn !== "string") return null;
  const employmentType = byType(included, EMPLOYMENT_TYPE_TYPE).find(
    (entity) => entity.entityUrn === urn,
  );
  return entityText(employmentType?.name);
}

function mapExperience(payload: VoyagerPayload): ExperienceItem[] {
  const { entries, included } = sectionsFor(payload, "positionGroups");
  const groups = byType(entries, POSITION_GROUP_TYPE);

  const items: ExperienceItem[] = [];
  for (const group of groups) {
    const positions = byType(
      resolveElements(
        resolveReference(group, "profilePositionInPositionGroup", included),
        included,
      ),
      POSITION_TYPE,
    );
    const groupCompany =
      entityText(group.companyName) ?? entityText(group.multiLocaleCompanyName);
    for (const position of positions) {
      items.push({
        title: entityText(position.title) ?? entityText(position.multiLocaleTitle),
        company: entityText(position.companyName) ?? groupCompany,
        location:
          entityText(position.locationName) ?? entityText(position.geoLocationName),
        employmentType: employmentTypeName(position, included),
        ...mapRange(position.dateRange),
        description: entityText(position.description),
      });
    }
  }
  return items;
}

function mapFlatSection<T>(
  payload: VoyagerPayload,
  key: keyof typeof SECTION_KEYS,
  mapper: (entity: SectionEntity) => T,
): T[] {
  const { entries } = sectionsFor(payload, key);
  return entries.map(mapper);
}

function mapEducation(entry: SectionEntity): EducationItem {
  return {
    school:
      entityText(entry.schoolName) ?? entityText(entry.multiLocaleSchoolName),
    degree:
      entityText(entry.degreeName) ?? entityText(entry.multiLocaleDegreeName),
    fieldOfStudy:
      entityText(entry.fieldOfStudy) ?? entityText(entry.multiLocaleFieldOfStudy),
    ...mapRange(entry.dateRange),
  };
}

function mapSkill(entry: SectionEntity): SkillItem {
  return {
    name: entityText(entry.name) ?? entityText(entry.multiLocaleName),
    endorsementCount: numeric(entry.endorsementCount ?? entry.numEndorsements),
  };
}

function mapCertification(entry: SectionEntity): CertificationItem {
  return {
    name: entityText(entry.name) ?? entityText(entry.multiLocaleName),
    authority:
      entityText(entry.authority) ?? entityText(entry.multiLocaleAuthority),
    ...mapRange(entry.dateRange),
  };
}

function mapLanguage(entry: SectionEntity): LanguageItem {
  return {
    name: entityText(entry.name) ?? entityText(entry.multiLocaleName),
    proficiency: entityText(entry.proficiency),
  };
}

export function mapSections(payload: VoyagerPayload): ProfileSections {
  return {
    experience: mapExperience(payload),
    education: mapFlatSection(payload, "educations", mapEducation),
    skills: mapFlatSection(payload, "skills", mapSkill),
    certifications: mapFlatSection(payload, "certifications", mapCertification),
    languages: mapFlatSection(payload, "languages", mapLanguage),
  };
}