import type { VoyagerTransport } from "./transport";
import { fetchProfile } from "./fetch";
import type { Profile } from "./profile";

export interface VoyagerClient {
  readonly kind: "voyager-client";
  getProfile(identifier: string): Promise<Profile>;
}

export function createVoyagerClient(options: { transport: VoyagerTransport }): VoyagerClient {
  return {
    kind: "voyager-client",
    getProfile(identifier: string): Promise<Profile> {
      return fetchProfile(options.transport, identifier);
    },
  };
}

export function isVoyagerClient(value: unknown): value is VoyagerClient {
  return typeof value === "object" && value !== null && "kind" in value;
}
