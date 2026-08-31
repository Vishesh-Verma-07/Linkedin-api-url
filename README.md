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
- `GET /api/me` — session owner (in progress)

See `CONTEXT.md` for the domain glossary and `docs/adr/` for architecture decisions.
