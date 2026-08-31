import type { VoyagerTransport } from "./transport";
import { assertSessionOk } from "./fetch-shared";

export const ABOUT_QUERY_ID =
  "voyagerIdentityDashProfileComponents.bbce8ad7b5f9ebfc86a1db21c6933760";
export const CONTACT_QUERY_ID =
  "voyagerIdentityDashProfileContactInfos.8d7150bb0ac83cb84bb37b90f8b7791b";

const GRAPHQL_PATH = "/voyager/api/graphql";

export interface ContactWebsite {
  label: string | null;
  url: string | null;
}

export interface Contact {
  emailAddress: string | null;
  phoneNumbers: string[];
  websites: ContactWebsite[];
  address: string | null;
}

export function emptyContact(): Contact {
  return { emailAddress: null, phoneNumbers: [], websites: [], address: null };
}

export function hasContactData(contact: Contact): boolean {
  return (
    contact.emailAddress !== null ||
    contact.phoneNumbers.length > 0 ||
    contact.websites.length > 0 ||
    contact.address !== null
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (isRecord(value)) {
    for (const key of ["text", "value", "plainText"]) {
      const inner = value[key];
      if (typeof inner === "string" && inner.trim()) return inner;
    }
  }
  return null;
}

function digAbout(components: unknown): string | null {
  if (Array.isArray(components)) {
    for (const component of components) {
      const found = digAbout(component);
      if (found !== null) return found;
    }
    return null;
  }
  if (isRecord(components)) {
    const about = stringValue(components.about);
    if (about !== null) return about;
    for (const key of Object.keys(components)) {
      const found = digAbout(components[key]);
      if (found !== null) return found;
    }
  }
  return null;
}

export function parseAboutGraphql(data: unknown): string | null {
  if (!isRecord(data)) return null;
  if (!isRecord(data.data)) return null;
  return digAbout(data.data);
}

function elementUrl(element: Record<string, unknown>): string | null {
  const url = element.url;
  if (!isRecord(url)) return null;
  const root = typeof url.rootUrl === "string" ? url.rootUrl : "";
  let path = "";
  if (Array.isArray(url.pathAggregations) && url.pathAggregations.length > 0) {
    const first = url.pathAggregations[0];
    if (isRecord(first) && typeof first.value === "string") path = first.value;
  }
  return root + path;
}

export function parseContactGraphql(data: unknown): Contact {
  const contact = emptyContact();
  if (!isRecord(data)) return contact;
  if (!isRecord(data.data)) return contact;
  const infos = data.data.profileContactInfos;
  if (!isRecord(infos)) return contact;
  const elements = infos.elements;
  if (!Array.isArray(elements)) return contact;

  for (const element of elements) {
    if (!isRecord(element)) continue;
    switch (element.type) {
      case "EMAIL": {
        const email = stringValue(element.emailAddress);
        if (email !== null) contact.emailAddress = email;
        break;
      }
      case "PHONE": {
        const phone = stringValue(element.phoneNumber);
        if (phone !== null) contact.phoneNumbers.push(phone);
        break;
      }
      case "WEB": {
        const url = elementUrl(element);
        if (url) {
          contact.websites.push({ label: stringValue(element.label), url });
        }
        break;
      }
      case "LOCATION": {
        const address = stringValue(element.address);
        if (address !== null) contact.address = address;
        break;
      }
      default:
        break;
    }
  }
  return contact;
}

function graphqlUrl(profileId: string, variables: string, queryId: string): string {
  const encodedVariables = encodeURIComponent(`(${variables.replace("PROFILE_ID", profileId)})`);
  return `${GRAPHQL_PATH}?variables=${encodedVariables}&queryId=${queryId}`;
}

async function graphqlGet<T>(
  transport: VoyagerTransport,
  profileUrn: string,
  variables: string,
  queryId: string,
  parse: (data: unknown) => T,
): Promise<T> {
  const url = graphqlUrl(profileUrn, variables, queryId);
  const res = await transport.request({ url });
  assertSessionOk(res);
  return parse(res.data);
}

export function fetchAboutFallback(
  transport: VoyagerTransport,
  profileUrn: string,
): Promise<string | null> {
  return graphqlGet(
    transport,
    profileUrn,
    "profileId:PROFILE_ID",
    ABOUT_QUERY_ID,
    parseAboutGraphql,
  );
}

export function fetchContactFallback(
  transport: VoyagerTransport,
  profileUrn: string,
): Promise<Contact> {
  return graphqlGet(
    transport,
    profileUrn,
    "profileId:PROFILE_ID,authType:nameAndHeadline",
    CONTACT_QUERY_ID,
    parseContactGraphql,
  );
}
