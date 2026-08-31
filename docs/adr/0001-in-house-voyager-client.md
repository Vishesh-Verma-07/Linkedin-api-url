# ADR-0001: Use an in-house Voyager client, not a third-party LinkedIn library

- Date: 2026-08-31
- Status: Accepted

## Context

The companion service needs to fetch LinkedIn profile data for a profile subject and the session owner. A third-party LinkedIn library already exists in the ecosystem and was used by the previous CommonJS service. We control the session cookies and need precise, testable control over the payloads we emit.

## Decision

Fetch Voyager endpoints directly with a hand-written client (over axios) rather than depending on a third-party LinkedIn library. The client is injected through the `createApp(client)` seam so every route can be tested offline against fixture payloads.

## Consequences

- No third-party library to track for breaking changes or LinkedIn-specific quirks.
- We own transport details (session headers, decorations, fallback behavior) and can verify them at a single test seam.
- More maintenance surface for wired LinkedIn endpoint shapes, documented in later ADRs.
- Contradicts the previous service's use of a library; intentionally reopened.
