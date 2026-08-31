export const PROFILE_TYPE = "com.linkedin.voyager.dash.identity.profile.Profile";
export const CONNECTION_COUNT_TYPE =
  "com.linkedin.voyager.dash.identity.profile.DashMemberConnectionCount";
export const FOLLOW_INFO_TYPE =
  "com.linkedin.voyager.dash.identity.profile.FollowInfo";
export const COLLECTION_TYPE = "com.linkedin.restli.common.CollectionResponse";
export const POSITION_GROUP_TYPE =
  "com.linkedin.voyager.dash.identity.profile.PositionGroup";
export const POSITION_TYPE =
  "com.linkedin.voyager.dash.identity.profile.Position";
export const EDUCATION_TYPE =
  "com.linkedin.voyager.dash.identity.profile.Education";
export const SKILL_TYPE = "com.linkedin.voyager.dash.identity.profile.Skill";
export const CERTIFICATION_TYPE =
  "com.linkedin.voyager.dash.identity.profile.Certification";
export const LANGUAGE_TYPE =
  "com.linkedin.voyager.dash.identity.profile.Language";
export const EMPLOYMENT_TYPE_TYPE =
  "com.linkedin.voyager.dash.identity.profile.EmploymentType";

export function numeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}