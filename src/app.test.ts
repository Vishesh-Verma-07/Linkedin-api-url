import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app";
import type { VoyagerClient } from "./voyager/client";

const fakeClient: VoyagerClient = { kind: "voyager-client" };

describe("GET /health", () => {
  it("returns ok status and a timestamp", async () => {
    const res = await request(createApp(fakeClient)).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
  });
});

describe("security middleware", () => {
  it("sets a helmet security header", async () => {
    const res = await request(createApp(fakeClient)).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});
