import type { TransportResponse } from "./transport";
import { AuthRedirectError, UnexpectedHtmlError } from "./errors";

export function looksLikeHtml(data: unknown): boolean {
  if (typeof data !== "string") return false;
  const head = data.trimStart().slice(0, 200).toLowerCase();
  return head.startsWith("<!doctype html") || head.startsWith("<html");
}

export function assertSessionOk(res: TransportResponse): void {
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
