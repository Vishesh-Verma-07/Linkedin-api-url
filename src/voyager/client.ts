export interface VoyagerClient {
  readonly kind: "voyager-client";
}

export function isVoyagerClient(value: unknown): value is VoyagerClient {
  return typeof value === "object" && value !== null && "kind" in value;
}
