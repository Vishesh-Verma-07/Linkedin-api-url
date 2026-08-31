import type { VoyagerPayload, VoyagerIncludedEntity } from "./payload";
import { mapSections, type ProfileSections } from "./sections";
import {
  PROFILE_TYPE,
  CONNECTION_COUNT_TYPE,
  FOLLOW_INFO_TYPE,
  numeric,
} from "./dash";

export interface Profile extends ProfileSections {
  id: number;
  publicIdentifier: string;
  firstName: string;
  lastName: string;
  fullName: string;
  headline: string | null;
  about: string | null;
  location: string | null;
  countryCode: string | null;
  avatarUrl: string | null;
  backgroundUrl: string | null;
  followersCount: number | null;
  connectionsCount: number | null;
}

function idFromUrn(urn: string | undefined): number | null {
  if (!urn) return null;
  const last = urn.split(":").pop();
  if (!last || !/^\d+$/.test(last)) return null;
  return Number(last);
}

function imageUrl(image: unknown): string | null {
  if (typeof image !== "object" || image === null) return null;
  const ref = (image as { displayImageReference?: unknown }).displayImageReference;
  if (typeof ref !== "object" || ref === null) return null;
  const vector = (ref as { vectorImage?: unknown }).vectorImage;
  if (typeof vector !== "object" || vector === null) return null;
  const v = vector as {
    rootUrl?: string;
    artifacts?: Array<{ fileIdentifyingUrlPathSegment?: string }>;
  };
  const base = v.rootUrl ?? "";
  const artifact = v.artifacts?.[0]?.fileIdentifyingUrlPathSegment;
  if (!artifact) return null;
  return base + artifact;
}

export function mapProfilePayload(payload: VoyagerPayload): Profile {
  const profile = payload.included?.find(
    (e): e is VoyagerIncludedEntity => e.$type === PROFILE_TYPE,
  );
  const connections = payload.included?.find((e) => e.$type === CONNECTION_COUNT_TYPE);
  const follow = payload.included?.find((e) => e.$type === FOLLOW_INFO_TYPE);

  const id = idFromUrn(profile?.entityUrn) ?? 0;
  const firstName = profile?.firstName ?? "";
  const lastName = profile?.lastName ?? "";

  return {
    ...mapSections(payload),
    id,
    publicIdentifier: profile?.publicIdentifier ?? "",
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" "),
    headline: profile?.headline ?? null,
    about: profile?.about ?? null,
    location: profile?.locationName ?? null,
    countryCode: profile?.geoLocation?.country ?? null,
    avatarUrl: imageUrl(profile?.profilePicture),
    backgroundUrl: imageUrl(profile?.backgroundImage),
    followersCount: numeric(follow?.followersCount),
    connectionsCount: numeric(connections?.connectionsCount),
  };
}
