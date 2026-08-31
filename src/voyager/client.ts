import type { VoyagerTransport } from "./transport";
import { fetchProfile } from "./fetch";
import { fetchMe } from "./fetch-me";
import type { Profile } from "./profile";

export interface VoyagerClient {
  readonly kind: "voyager-client";
  getProfile(identifier: string): Promise<Profile>;
  getMe(): Promise<Profile>;
}

export function createVoyagerClient(options: { transport: VoyagerTransport }): VoyagerClient {
  return {
    kind: "voyager-client",
    getProfile(identifier: string): Promise<Profile> {
      return fetchProfile(options.transport, identifier);
    },
    getMe(): Promise<Profile> {
      return fetchMe(options.transport);
    },
  };
}

export function isVoyagerClient(value: unknown): value is VoyagerClient {
  return typeof value === "object" && value !== null && "kind" in value;
}
