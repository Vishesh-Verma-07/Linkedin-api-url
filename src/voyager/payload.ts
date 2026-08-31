export interface VoyagerImageReference {
  vectorImage?: {
    rootUrl?: string;
    artifacts?: Array<{
      width?: number;
      height?: number;
      fileIdentifyingUrlPathSegment?: string;
    }>;
  };
}

export interface VoyagerImage {
  displayImageReference?: VoyagerImageReference;
}

export interface VoyagerIncludedEntity {
  $type?: string;
  entityUrn?: string;
  publicIdentifier?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  about?: string;
  locationName?: string;
  geoLocation?: { country?: string };
  profilePicture?: VoyagerImage;
  backgroundImage?: VoyagerImage;
  connectionsCount?: number | string;
  followersCount?: number | string;
  emailAddress?: unknown;
  phoneNumbers?: unknown[];
  websites?: unknown[];
  address?: unknown;
  [key: string]: unknown;
}

export interface VoyagerPayload {
  included?: VoyagerIncludedEntity[];
}
