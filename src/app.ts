import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import type { VoyagerClient } from "./voyager/client";
import { parsePublicIdentifier } from "./voyager/parse";
import { isSessionFailure } from "./voyager/errors";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

export function createApp(client: VoyagerClient): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api", apiLimiter);

  app.get("/api/profile", async (req, res) => {
    const raw = typeof req.query.url === "string" ? req.query.url : undefined;
    if (!raw) {
      res.status(400).json({ error: "Missing required query parameter: url" });
      return;
    }

    const identifier = parsePublicIdentifier(raw);
    if (identifier === null) {
      res.status(400).json({
        error: "Invalid url. Provide a LinkedIn profile URL or a public identifier.",
      });
      return;
    }

    try {
      const profile = await client.getProfile(identifier);
      res.json(profile);
    } catch (err) {
      if (isSessionFailure(err)) {
        res.status(401).json({
          error: "Your LinkedIn session has expired. Refresh LINKEDIN_LI_AT / LINKEDIN_JSESSIONID.",
        });
        return;
      }
      res.status(500).json({ error: "Failed to fetch the profile." });
    }
  });

  app.get("/api/me", async (_req, res) => {
    try {
      const profile = await client.getMe();
      res.json(profile);
    } catch (err) {
      if (isSessionFailure(err)) {
        res.status(401).json({
          error: "Your LinkedIn session has expired. Refresh LINKEDIN_LI_AT / LINKEDIN_JSESSIONID.",
        });
        return;
      }
      res.status(500).json({ error: "Failed to fetch the session owner's profile." });
    }
  });

  app.use((_req, res) => {
    res.status(404).json({
      error: "Not found",
      endpoints: [
        { method: "GET", path: "/health" },
        { method: "GET", path: "/api/profile?url=<linkedin-url-or-identifier>" },
        { method: "GET", path: "/api/me" },
      ],
    });
  });

  return app;
}
