# Context — LinkedIn API Companion Service

A companion HTTP service that reads LinkedIn profile data for a profile subject or the session owner, using the LinkedIn session cookies directly.

## Glossary

- **Profile subject**: the person whose profile is being read by `GET /api/profile?url=...`. Identified by a public identifier (URL slug or bare identifier).
- **Session owner**: the authenticated LinkedIn account whose session cookies drive the service; returned by `GET /api/me`.
- **Voyager**: LinkedIn's internal mobile-web API layer, exposed at `/voyager/api/...`. The service talks to it directly without a third-party library.
- **Decorated profile payload**: the JSON returned by Voyager's decorated-profiles endpoint, containing the profile's identity fields plus an `included[]` array of related entities (positions, educations, skills, certifications, languages). Fetched with a decoration such as `FullProfileWithEntities-93`, with `FullProfile-138` as a fallback.
- **Public identifier**: the stable string that names a profile subject in a LinkedIn URL, e.g. `satyanadella` in `https://www.linkedin.com/in/satyanadella`.

## Terms to avoid

Prefer the vocabulary above over synonyms the glossary avoids: don't call a profile subject a "user", and don't call Voyager "the LinkedIn API" without glossing it. Use **decorated profile payload** rather than "raw JSON".
