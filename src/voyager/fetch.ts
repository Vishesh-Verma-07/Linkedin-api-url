import type { VoyagerTransport, TransportResponse } from "./transport";
import { mapProfilePayload, type Profile } from "./profile";
import type { VoyagerPayload } from "./payload";
import { AuthRedirectError, UnexpectedHtmlError, isSessionFailure } from "./errors";

const FULL_PROFILE_WITH_ENTITIES_93 =
  "com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-93";
const FULL_PROFILE_138 = "com.linkedin.voyager.dash.deco.identity.profile.FullProfile-138";
const DECORATIONS = [FULL_PROFILE_WITH_ENTITIES_93, FULL_PROFILE_138];

function looksLikeHtml(data: unknown): boolean {
  if (typeof data !== "string") return false;
  const head = data.trimStart().slice(0, 200).toLowerCase();
  return head.startsWith("<!doctype html") || head.startsWith("<html");
}

function assertSessionOk(res: TransportResponse): void {
  if (res.status >= 300 && res.status < 400) {
    throw new AuthRedirectError(
      `LinkedIn responded with a redirect (HTTP ${res.status}); the session cookie is no longer accepted.`,
    );
  }
  if (looksLikeHtml(res.data)) {
    throw new UnexpectedHtmlError(
      "LinkedIn returned an HTML page instead of a JSON payload; the session has expired.",
    );
  }
}

async function fetchDecorated(
  transport: VoyagerTransport,
  identifier: string,
  decoration: string,
): Promise<VoyagerPayload> {
  const url =
    `/voyager/api/identity/dash/profiles` +
    `?q=memberIdentity&memberIdentity=${encodeURIComponent(identifier)}` +
    `&decorationId=${encodeURIComponent(decoration)}`;
  const res = await transport.request({ url });

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

export async function fetchProfile(
  transport: VoyagerTransport,
  identifier: string,
): Promise<Profile> {
  let lastError: unknown;
  for (const decoration of DECORATIONS) {
    try {
      const payload = await fetchDecorated(transport, identifier, decoration);
      return mapProfilePayload(payload);
    } catch (err) {
      if (isSessionFailure(err)) {
        throw err;
      }
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to fetch profile for ${identifier}.`);
}
