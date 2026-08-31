# LinkedIn API Companion Service

A TypeScript companion HTTP service that reads LinkedIn profile data for a profile subject or the session owner, using LinkedIn session cookies directly via an in-house Voyager client.

## Prerequisites

- Node.js 18+ / npm
- LinkedIn session cookies set as env vars:

```
LINKEDIN_LI_AT=<your li_at cookie>
LINKEDIN_JSESSIONID=<your JSESSIONID cookie>
```

## Scripts

```bash
npm install          # install dependencies
npm run dev:ts       # start the service (tsx, no build step) on PORT (default 4000)
npm run typecheck    # strict TypeScript check
npm test             # run the vitest + supertest suite
```

## Endpoints

- `GET /health` — `{ status: "ok", timestamp }`
- `GET /api/profile?url=...` — profile subject identity fields (takes a `linkedin.com/in/<slug>` URL or a bare public identifier)
- `GET /api/me` — session owner

## Usage

### Start the service

```bash
export LINKEDIN_LI_AT=<your li_at cookie>
export LINKEDIN_JSESSIONID=<your JSESSIONID cookie>
npm run dev:ts
```

The service listens on `PORT` (default `4000`). Refuses to start if the session env vars are missing.

### GET /api/profile

Fetch a profile subject by URL or bare public identifier:

```bash
# by LinkedIn URL
curl "http://localhost:4000/api/profile?url=https://www.linkedin.com/in/satyanadella"

# by bare public identifier
curl "http://localhost:4000/api/profile?url=satyanadella"
```

Returns the profile subject's flat readable identity JSON (id, publicIdentifier, name, headline, about, location, country code, avatar/background URLs, follower/connection counts, and the experience/education/skills/certifications/languages sections).

### GET /api/me

Fetch the authenticated session owner's own profile:

```bash
curl "http://localhost:4000/api/me"
```

Returns the same flat readable schema as `/api/profile`.

## Error handling

| Condition | Status |
|---|---|
| Missing or unparseable `url` on `/api/profile` | `400` |
| Session expired (auth redirect or unexpected HTML) | `401` |
| Genuine fetch failure | `500` |
| Unknown route | `404` with the endpoint list |

See `CONTEXT.md` for the domain glossary and `docs/adr/` for architecture decisions.
