const IDENTIFIER_PATTERN = /^[A-Za-z0-9.\-_]+$/;

export function parsePublicIdentifier(input: string): string | null {
  const trimmed = input?.trim() ?? "";
  if (!trimmed) return null;

  let candidate = trimmed;
  const linkedInInMatch = /linkedin\.com\/in\/([^/?#]+)/.exec(trimmed);
  if (linkedInInMatch) {
    candidate = linkedInInMatch[1] ?? "";
  } else if (/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  const slug = (candidate ?? "").replace(/^\/+|\/+$/g, "");
  if (!slug) return null;
  if (!IDENTIFIER_PATTERN.test(slug)) return null;

  return slug;
}
