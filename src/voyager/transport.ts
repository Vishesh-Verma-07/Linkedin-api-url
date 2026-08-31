import axios, { type AxiosRequestConfig } from "axios";
import type { SessionEnv } from "../env";

export interface TransportResponse {
  status: number;
  data: unknown;
}

export interface TransportRequest {
  url: string;
}

export type VoyagerSession = SessionEnv;

export interface VoyagerTransport {
  request(config: TransportRequest): Promise<TransportResponse>;
}

export function createAxiosTransport(
  session: VoyagerSession,
  overrides?: AxiosRequestConfig,
): VoyagerTransport {
  const instance = axios.create({
    baseURL: "https://www.linkedin.com",
    headers: {
      Accept: "application/vnd.linkedin.normalized+json+2.1",
      "X-RestLi-Protocol-Version": "2.0.0",
      "csrf-token": session.jsessionid,
      Cookie: `li_at=${session.liAt}; JSESSIONID=${JSON.stringify(session.jsessionid)}`,
    },
    ...overrides,
  });

  return {
    async request({ url }) {
      const res = await instance.get(url);
      return { status: res.status, data: res.data };
    },
  };
}
