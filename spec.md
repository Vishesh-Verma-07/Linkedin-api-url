# Spec — LinkedIn API Companion Service

Source: GitHub issues #1–6 on `Vishesh-Verma-07/Linkedin-api`
Generated: 2026-08-31

Blocking graph: `#1` → `#2` → `#3, #4, #5, #6` (all blocked by #2)

---

## #1 — Foundation: TypeScript service skeleton + domain docs

State: OPEN | Labels: ready-for-agent | Blocking: #2

### What to build

A new TypeScript companion service that can be started alongside the existing CommonJS service without disturbing it. Run the service directly with tsx (no build step): it boots an Express app on `PORT` (default 4000), loads the LinkedIn session cookie env vars and refuses to start if they're missing, and serves a health check. The service is structured as a `createApp(client)` factory so the Voyager network layer can be injected at a single seam in tests. The npm scripts, strict tsconfig, and the vitest + supertest test harness are established here, plus the domain docs that later tickets speak against.

### Acceptance criteria

- [ ] `npm run dev:ts` (tsx) starts a TS Express service on port 4000 (overridable via `PORT`)
- [ ] `GET /health` returns `{ status: "ok", timestamp }`
- [ ] Missing `LINKEDIN_LI_AT` / `LINKEDIN_JSESSIONID` env vars cause startup to fail with a clear error
- [ ] Security middleware mirrors the old service: helmet, cors, JSON body parsing, and per-route rate limiting on API routes
- [ ] `createApp(client)` factory exists with a `VoyagerClient` interface as its single injectable seam
- [ ] `npm run typecheck` passes strict TypeScript checks
- [ ] vitest + supertest harness runs an initial offline HTTP test against the injected seam
- [ ] `CONTEXT.md` glossary created (profile subject, session owner, Voyager, decorated profile payload, public identifier) and ADR recorded for the in-house client decision

### Blocked by

- None (can start immediately)

---

## #2 — In-house Voyager client + profile-subject green path (identity fields)

State: OPEN | Labels: ready-for-agent | Blocked by: #1 | Blocking: #6, #5, #4, #3

### What to build

`GET /api/profile?url=...` works end-to-end for a profile subject's identity data, fetched entirely by a hand-written Voyager client (no third-party library). The URL is parsed (slug extracted from `linkedin.com/in/<slug>`, bare string treated as a public identifier). The response is flat and readable: numeric id, public identifier, first/last/full name, headline, about (from the main payload), location, country code, avatar and background URLs, and follower/connection counts. Session failures are detected (3xx redirect, HTML body) and typed error classes are defined for the routes to map. Verified offline at the HTTP seam using an injected transport returning green fixture payloads.

### Acceptance criteria

- [ ] An in-house Voyager client fetches a profile subject via the decorated profiles endpoint with the `FullProfileWithEntities-93` decoration, falling back to `FullProfile-138` on failure
- [ ] Transport sends the session headers (csrf-token from JSESSIONID, li_at cookie, normalized JSON accept, restli 2.0.0) via axios
- [ ] 3xx responses raise an auth-redirect error; HTML bodies raise an unexpected-HTML error
- [ ] `GET /api/profile?url=https://www.linkedin.com/in/satyanadella` returns flat readable JSON with the identity fields listed above
- [ ] `GET /api/profile?url=satyanadella` (bare identifier) works the same way
- [ ] All identity fields verified at the HTTP seam against green fixture payloads (no real network)

### Blocked by

- #1

---

## #3 — Section parsing: experience, education, skills, certifications, languages

State: OPEN | Labels: ready-for-agent | Blocked by: #2

### What to build

The profile subject's detail sections are resolved from the same decorated payload's `included[]` array via their star-collection references and appear in the readable response: experience (flattened to one level, company inherited from the position group), education, skills (with endorsement counts), certifications, and languages (with proficiency). Each section renders as a readable array with plain dates. Verified at the HTTP seam with rich green fixtures — the single-seam requirement.

### Acceptance criteria

- [ ] `experience` is a flat list: title, company, location, employmentType, startDate/endDate (year/month), description
- [ ] `education` lists school, degree, fieldOfStudy, startDate/endDate
- [ ] `skills` lists name and endorsementCount
- [ ] `certifications` lists name, authority, startDate/endDate
- [ ] `languages` lists name and proficiency
- [ ] Dates render as `{ year, month, day }` (nulls where absent); empty/missing sections render as empty arrays
- [ ] All sections verified at the HTTP seam against green fixture payloads (no real network)

### Blocked by

- #2

---

## #4 — GraphQL fallbacks: About and Contact

State: OPEN | Labels: ready-for-agent | Blocked by: #2

### What to build

About and contact information survive payloads that omit them. When the decorated payload lacks the About text, fetch it via the documented about queryId; when it lacks contact data, fetch via the contact queryId — matching the library's fallback behavior, but in-house. Contact maps to readable fields: emailAddress, phoneNumbers, websites (label + url), address. Verified at the HTTP seam with fallback-shaped fixtures.

### Acceptance criteria

- [ ] About text fetched via the about queryId when the main payload omits it
- [ ] Contact info fetched via the contact queryId when the main payload omits it
- [ ] Contact renders as `emailAddress`, `phoneNumbers` (array), `websites` (array of label+url), `address`
- [ ] Missing fields render as null / empty arrays without error; when present in the main payload, no fallback call is made
- [ ] Both fallbacks verified at the HTTP seam against fallback-shaped fixtures (no real network)

### Blocked by

- #2

---

## #5 — Error paths: input & session failures

State: OPEN | Labels: ready-for-agent | Blocked by: #2

### What to build

The full status-code contract for the new service, plus the 404 handler. Missing or garbage URLs return 400, auth-redirect and unexpected-HTML conditions return 401 (session expired), and genuine fetch failures return 500. Every branch is asserted at the HTTP seam with negative fixtures so the contract is stable.

### Acceptance criteria

- [ ] Missing `url` query param on the profile route returns 400
- [ ] Unparseable URL input returns 400
- [ ] Auth-redirect (3xx) condition returns 401
- [ ] Unexpected-HTML (session expired) condition returns 401
- [ ] Rejected fetch returns 500
- [ ] Unknown routes return 404 with the endpoint list
- [ ] All error branches asserted offline at the HTTP seam with negative fixtures

### Blocked by

- #2

---

## #6 — Session-owner endpoint: GET /api/me

State: OPEN | Labels: ready-for-agent | Blocked by: #2

### What to build

`GET /api/me` returns the authenticated session owner's own profile, fetched in-house from the `/voyager/api/me` endpoint (no third-party library), mapped into the same flat readable shape as the profile-subject response. Verified at the HTTP seam with a mini-profile fixture.

### Acceptance criteria

- [ ] `GET /api/me` returns the session owner's profile via the in-house Voyager client
- [ ] Response uses the same flat readable schema as `/api/profile` (id, publicIdentifier, name, headline, avatar, etc.)
- [ ] A missing/empty mini-profile response surfaces a clear failure (500) rather than a silent empty body
- [ ] Verified offline at the HTTP seam against a mini-profile fixture (no real network)

### Blocked by

- #2
