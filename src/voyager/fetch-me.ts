import type { VoyagerTransport, TransportResponse } from "./transport";
import { mapProfilePayload, type Profile } from "./profile";
import type { VoyagerPayload } from "./payload";
import { assertSessionOk } from "./fetch-shared";
import { PROFILE_TYPE } from "./dash";

function isProfilePayload(value: unknown): value is VoyagerPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as VoyagerPayload).included)
  );
}

export async function fetchMe(transport: VoyagerTransport): Promise<Profile> {
  const res: TransportResponse = await transport.request({ url: "/voyager/api/me" });

  assertSessionOk(res);

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`LinkedIn responded with HTTP ${res.status}.`);
  }

  if (typeof res.data === "string" || !isProfilePayload(res.data)) {
    throw new Error("LinkedIn response was not a decorated profile payload.");
  }

  const subject = res.data.included?.find((e) => e.$type === PROFILE_TYPE);
  if (!subject) {
    throw new Error("LinkedIn returned an empty profile for the session owner.");
  }

  return mapProfilePayload(res.data);
}
