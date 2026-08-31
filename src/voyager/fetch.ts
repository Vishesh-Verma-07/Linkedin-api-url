import type { VoyagerTransport, TransportResponse } from "./transport";
import { mapProfilePayload, type Profile } from "./profile";
import type { VoyagerPayload, VoyagerIncludedEntity } from "./payload";
import { isSessionFailure } from "./errors";
import { assertSessionOk } from "./fetch-shared";
import {
  fetchAboutFallback,
  fetchContactFallback,
  emptyContact,
  hasContactData,
  type Contact,
} from "./graphql";
import { PROFILE_TYPE } from "./dash";

const FULL_PROFILE_WITH_ENTITIES_93 =
  "com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-93";
const FULL_PROFILE_138 = "com.linkedin.voyager.dash.deco.identity.profile.FullProfile-138";
const DECORATIONS = [FULL_PROFILE_WITH_ENTITIES_93, FULL_PROFILE_138];

async function fetchDecorated(
  transport: VoyagerTransport,
  identifier: string,
  decoration: string,
): Promise<VoyagerPayload> {
  const url =
    `/voyager/api/identity/dash/profiles` +
    `?q=memberIdentity&memberIdentity=${encodeURIComponent(identifier)}` +
    `&decorationId=${encodeURIComponent(decoration)}`;
  const res: TransportResponse = await transport.request({ url });

  assertSessionOk(res);

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`LinkedIn responded with HTTP ${res.status}.`);
  }

  if (typeof res.data === "string" || !isDecoratedPayload(res.data)) {
    throw new Error("LinkedIn response was not a decorated profile payload.");
  }
  return res.data;
}

function isDecoratedPayload(value: unknown): value is VoyagerPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as VoyagerPayload).included)
  );
}

async function bestEffort<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (isSessionFailure(err)) throw err;
    return fallback;
  }
}

export async function fetchProfile(
  transport: VoyagerTransport,
  identifier: string,
): Promise<Profile> {
  let lastError: unknown;
  let payload: VoyagerPayload | null = null;
  let profile: Profile | null = null;

  for (const decoration of DECORATIONS) {
    try {
      payload = await fetchDecorated(transport, identifier, decoration);
      profile = mapProfilePayload(payload);
      break;
    } catch (err) {
      if (isSessionFailure(err)) {
        throw err;
      }
      lastError = err;
    }
  }

  if (!payload || !profile) {
    throw lastError instanceof Error
      ? lastError
      : new Error(`Failed to fetch profile for ${identifier}.`);
  }

  const subject = payload.included?.find(
    (e): e is VoyagerIncludedEntity => e.$type === PROFILE_TYPE,
  );
  const profileUrn = subject?.entityUrn ?? null;

  if (profileUrn !== null && profile.about === null) {
    profile.about = await bestEffort<string | null>(
      () => fetchAboutFallback(transport, profileUrn),
      null,
    );
  }

  if (profileUrn !== null && !hasContactData(profile.contact)) {
    const contact: Contact = await bestEffort<Contact>(
      () => fetchContactFallback(transport, profileUrn),
      emptyContact(),
    );
    profile.contact = contact;
  }

  return profile;
}
