import { describe, it, expect, vi } from "vitest";
import { createAxiosTransport, type TransportRequest } from "./transport";

const session = { liAt: "li_at_val", jsessionid: "ajax:abc123" };

function adapterRespondingWith(
  data: unknown,
  status: number,
  contentType = "application/vnd.linkedin.normalized+json",
) {
  const seen: Array<{ url: string; headers: Record<string, unknown> }> = [];
  const transport = createAxiosTransport(session, {
    adapter: async (config) => {
      seen.push({
        url: config.url ?? "",
        headers: (config.headers as Record<string, unknown>) ?? {},
      });
      return {
        data,
        status,
        statusText: "OK",
        headers: { "content-type": contentType },
        config,
      };
    },
  });
  return { transport, seen };
}

describe("createAxiosTransport", () => {
  it("sends session headers on every request via axios", async () => {
    const { transport, seen } = adapterRespondingWith({ ok: true }, 200);
    await transport.request({ url: "/voyager/api/thing" } as TransportRequest);

    const headers = seen[0]!.headers;
    expect(headers["Accept"]).toBe("application/vnd.linkedin.normalized+json+2.1");
    expect(headers["X-RestLi-Protocol-Version"]).toBe("2.0.0");
    expect(headers["csrf-token"]).toBe("ajax:abc123");
    expect(headers["Cookie"]).toContain("li_at=li_at_val");
    expect(headers["Cookie"]).toContain("JSESSIONID=\"ajax:abc123\"");
  });

  it("parses a normalized-JSON response body into an object", async () => {
    const { transport } = adapterRespondingWith({ included: [] }, 200);
    const res = await transport.request({ url: "/voyager/api/thing" } as TransportRequest);
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ included: [] });
  });

  it("passes through an HTML body as a raw string", async () => {
    const { transport } = adapterRespondingWith(
      "<!DOCTYPE html><html><body>authwall</body></html>",
      200,
      "text/html",
    );
    const res = await transport.request({ url: "/voyager/api/thing" } as TransportRequest);
    expect(typeof res.data).toBe("string");
  });
});
